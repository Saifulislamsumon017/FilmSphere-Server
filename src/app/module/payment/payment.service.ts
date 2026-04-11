/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import status from 'http-status';

import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';

import {
  PaymentStatus,
  PurchaseStatus,
  PurchaseType,
} from '../../../generated/prisma/enums.js';

import { stripe } from '../../config/stripe.config.js';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';

import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { Prisma, Purchase } from '../../../generated/prisma/client.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

import { generateInvoicePdf } from './payment.invoice.utils.js';
import { sendEmail } from '../../utils/email.js';
import { uploadFileToCloudinary } from '../../config/cloudinary.config.js';
import { envVars } from '../../config/env.js';

/* ================= CREATE CHECKOUT ================= */

const createCheckout = async (
  user: IRequestUser,
  payload: { movieId: string; purchaseType: PurchaseType },
) => {
  const movie = await prisma.movie.findUnique({
    where: { id: payload.movieId },
  });

  if (!movie) throw new AppError(status.NOT_FOUND, 'Movie not found');

  const amount =
    payload.purchaseType === PurchaseType.BUY
      ? movie.buyPrice
      : movie.rentPrice;

  if (!amount) throw new AppError(status.BAD_REQUEST, 'Invalid price');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',

    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: movie.title,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],

    success_url: `${envVars.FRONTEND_URL}/payment-success`,
    cancel_url: `${envVars.FRONTEND_URL}/payment-cancel`,

    customer_email: user.email,

    metadata: {
      userId: user.userId,
      movieId: payload.movieId,
      purchaseType: payload.purchaseType,
    },
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

/* ================= STRIPE WEBHOOK ================= */

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  // idempotency check
  const existing = await prisma.purchase.findFirst({
    where: { stripeTransactionId: event.id },
  });

  if (existing) {
    console.log(`Event ${event.id} already processed`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const movieId = session.metadata?.movieId;
      const purchaseType = session.metadata?.purchaseType as PurchaseType;

      if (!userId || !movieId || !purchaseType) {
        console.error('Missing metadata');
        return;
      }

      try {
        const movie = await prisma.movie.findUnique({
          where: { id: movieId },
        });

        if (!movie) {
          console.error('Movie not found');
          return;
        }

        // ✅ FIX: real user fetch (IMPORTANT)
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        const amount = session.amount_total ? session.amount_total / 100 : 0;

        let pdfBuffer: Buffer | null = null;

        const result = await prisma.$transaction(async tx => {
          const purchase = await tx.purchase.create({
            data: {
              userId,
              movieId,
              purchaseType,
              amount,
              stripeTransactionId: event.id,

              paymentStatus:
                session.payment_status === 'paid'
                  ? PaymentStatus.PAID
                  : PaymentStatus.FAILED,

              status:
                session.payment_status === 'paid'
                  ? PurchaseStatus.ACTIVE
                  : PurchaseStatus.CANCELLED,

              expiresAt:
                purchaseType === PurchaseType.RENT
                  ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  : null,
            },
          });

          let invoiceUrl: string | null = null;

          // invoice only if paid
          if (session.payment_status === 'paid') {
            try {
              pdfBuffer = await generateInvoicePdf({
                invoiceId: purchase.id,
                userName: user?.name || 'User', // ✅ FIXED
                userEmail: user?.email || session.customer_email || '',
                movieTitle: movie.title,
                purchaseType,
                amount,
                transactionId: session.id,
                paymentDate: new Date().toISOString(),
              });

              // Upload PDF to Cloudinary
              const cloudinaryResponse = await uploadFileToCloudinary(
                pdfBuffer,
                `movies/invoices/invoice-${purchase.id}.pdf`,
              );

              invoiceUrl = cloudinaryResponse?.secure_url;
            } catch (err) {
              console.error('Invoice error:', err);
            }
          }

          const updatedPurchase = await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              invoiceUrl,
            } as any,
          });

          return { updatedPurchase, invoiceUrl, pdfBuffer };
        });

        // send email outside transaction
        if (session.payment_status === 'paid') {
          try {
            await sendEmail({
              to: user?.email || session.customer_email || '',
              subject: `Invoice - ${movie.title}`,
              templateName: 'invoice',
              templateData: {
                movie: movie.title,
                amount,
                userName: user?.name || 'User',
                invoiceId: result.updatedPurchase.id,
                invoiceUrl: result.invoiceUrl,
              },
              attachment: [
                {
                  filename: `invoice-${result.updatedPurchase.id}.pdf`,
                  content: result.pdfBuffer || Buffer.from(''),
                  contentType: 'application/pdf',
                },
              ],
            });
          } catch (err) {
            console.error('Email error:', err);
          }
        }

        console.log(`Payment success: ${movie.title}`);
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

/* ================= REFUND ================= */

const refundPayment = async (purchaseId: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) throw new AppError(404, 'Not found');

  if (purchase.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(400, 'Not refundable');
  }

  await stripe.refunds.create({
    payment_intent: purchase.stripeTransactionId!,
  });

  return prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
    },
  });
};

/* ================= GET ALL PURCHASES ================= */

const getAllPayment = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Purchase,
    Prisma.PurchaseWhereInput,
    Prisma.PurchaseInclude
  >(prisma.purchase, query, {
    searchableFields: ['movieId'],
    filterableFields: ['status', 'purchaseType', 'paymentStatus', 'userId'],
  });

  const result = await queryBuilder
    .search()
    .filter()
    .include({
      user: { select: { name: true, email: true } },
      movie: { select: { title: true, thumbnail: true } },
    })
    .paginate()
    .sort()
    .execute();

  return result;
};

/* ================= USER PURCHASES ================= */

const myPayment = async (user: IRequestUser, query: IQueryParams) => {
  return getAllPayment({
    ...query,
    userId: user.userId,
  });
};

export const paymentService = {
  createCheckout,
  handleStripeWebhookEvent,
  refundPayment,
  getAllPayment,
  myPayment,
};
