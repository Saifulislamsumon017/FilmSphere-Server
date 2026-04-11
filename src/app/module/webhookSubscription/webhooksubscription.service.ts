/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import status from 'http-status';

import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import { stripe, STRIPE_PLANS } from '../../config/stripe.config.js';

import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

import {
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../generated/prisma/enums.js';

import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { Prisma, Subscription } from '../../../generated/prisma/client.js';

import { sendEmail } from '../../utils/email.js';
import { uploadFileToCloudinary } from '../../config/cloudinary.config.js';
import { generateSubscriptionInvoice } from './subscription.invoice.utils.js';
import { envVars } from '../../config/env.js';

/* ================= CREATE CHECKOUT ================= */

const createCheckoutSubscription = async (
  user: IRequestUser,
  payload: { planType: SubscriptionPlan },
) => {
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: user.userId,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, 'Already subscribed');
  }

  const plan =
    payload.planType === SubscriptionPlan.MONTHLY
      ? STRIPE_PLANS.MONTHLY
      : STRIPE_PLANS.YEARLY;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',

    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],

    customer_email: user.email,

    success_url: `${envVars.FRONTEND_URL}/subscription-success`,
    cancel_url: `${envVars.FRONTEND_URL}/subscription-cancel`,

    metadata: {
      userId: user.userId,
      planType: payload.planType,
      priceId: plan.priceId,
    },
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

/* ================= WEBHOOK ================= */

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  // 🔥 idempotency check
  const existing = await prisma.subscription.findFirst({
    where: {
      stripeId: event.id,
    },
  });

  if (existing) {
    console.log(`Event ${event.id} already processed`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType as SubscriptionPlan;

      if (!userId || !planType) {
        console.error('Missing metadata');
        return;
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          console.error('User not found');
          return;
        }

        const startDate = new Date();
        const endDate = new Date();

        if (planType === SubscriptionPlan.MONTHLY) {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const amount = session.amount_total ? session.amount_total / 100 : 0;

        let pdfBuffer: Buffer | null = null;

        const result = await prisma.$transaction(async tx => {
          const subscription = await tx.subscription.create({
            data: {
              userId,
              planType,
              status: SubscriptionStatus.ACTIVE,
              paymentStatus: PaymentStatus.PAID,

              stripeId: event.id,

              startDate,
              endDate,
            },
          });

          let invoiceUrl: string | null = null;

          // 🔥 invoice generate + upload (Cloudinary pattern)
          if (session.payment_status === 'paid') {
            try {
              pdfBuffer = await generateSubscriptionInvoice({
                invoiceId: subscription.id,
                userName: user.name || 'User',
                userEmail: user.email,
                planType,
                amount,
                transactionId: session.id,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              });

              // 🔥 upload to cloudinary
              const cloudinaryResponse = await uploadFileToCloudinary(
                pdfBuffer,
                `subscriptions/invoices/subscription-${subscription.id}.pdf`,
              );

              invoiceUrl = cloudinaryResponse?.secure_url;
            } catch (err) {
              console.error('Invoice error:', err);
            }
          }

          const updated = await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              invoiceUrl,
            } as any,
          });

          return { updated, invoiceUrl, pdfBuffer };
        });

        // 🔥 email outside transaction
        if (session.payment_status === 'paid') {
          try {
            await sendEmail({
              to: user.email,
              subject: 'Subscription Invoice',
              templateName: 'invoice',
              templateData: {
                userName: user.name,
                planType,
                amount,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString(),
                invoiceId: result.updated.id,
                invoiceUrl: result.invoiceUrl,
              },
              attachment: [
                {
                  filename: `subscription-${result.updated.id}.pdf`,
                  content: result.pdfBuffer || Buffer.from(''),
                  contentType: 'application/pdf',
                },
              ],
            });
          } catch (err) {
            console.error('Email error:', err);
          }
        }

        console.log('Subscription success:', user.email);
      } catch (error) {
        console.error('Webhook error:', error);
      }

      break;
    }

    case 'checkout.session.expired': {
      console.log('Session expired');
      break;
    }

    case 'payment_intent.payment_failed': {
      console.log('Payment failed');
      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }
};

/* ================= MY SUBSCRIPTION ================= */

const mySubscription = async (user: IRequestUser) => {
  return prisma.subscription.findFirst({
    where: {
      userId: user.userId,
      status: SubscriptionStatus.ACTIVE,
    },
  });
};

/* ================= GET ALL ================= */

const getAllSubscription = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Subscription,
    Prisma.SubscriptionWhereInput,
    Prisma.SubscriptionInclude
  >(prisma.subscription, query, {
    searchableFields: [],
    filterableFields: ['status', 'planType', 'paymentStatus', 'userId'],
  });

  const result = await queryBuilder
    .filter()
    .include({
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    })
    .paginate()
    .sort()
    .execute();

  return result;
};

/* ================= CANCEL ================= */

const cancelSubscription = async (id: string, user: IRequestUser) => {
  const sub = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!sub) throw new AppError(404, 'Not found');

  if (sub.userId !== user.userId) {
    throw new AppError(403, 'Unauthorized');
  }

  return prisma.subscription.update({
    where: { id },
    data: {
      status: SubscriptionStatus.CANCELLED,
      endDate: new Date(),
    },
  });
};

export const subscriptionService = {
  createCheckoutSubscription,
  handleStripeWebhookEvent,
  mySubscription,
  getAllSubscription,
  cancelSubscription,
};
