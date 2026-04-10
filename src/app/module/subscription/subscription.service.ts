import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';

import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import {
  ICreateSubscriptionPayload,
  IConfirmSubscriptionPayload,
} from './subscription.interface.js';
import { stripe, STRIPE_PLANS } from '../../config/stripe.config.js';
import { envVars } from '../../config/env.js';
import { SubscriptionPlan } from '../../../generated/prisma/enums.js';

/* ================= CREATE ================= */

const createSubscription = async (
  user: IRequestUser,
  payload: ICreateSubscriptionPayload,
) => {
  const { userId, email } = user;

  const existing = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, 'Already subscribed');
  }

  const plan = STRIPE_PLANS[payload.planType];

  if (!plan?.priceId) {
    throw new AppError(status.BAD_REQUEST, 'Invalid plan');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${envVars.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${envVars.FRONTEND_URL}/subscription/cancel`,
    customer_email: email,
    metadata: {
      userId,
      planType: payload.planType,
    },
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

/* ================= CONFIRM ================= */

const confirmSubscription = async (payload: IConfirmSubscriptionPayload) => {
  const session = await stripe.checkout.sessions.retrieve(payload.sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError(status.BAD_REQUEST, 'Payment not completed');
  }

  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType as SubscriptionPlan;

  if (!userId || !planType) {
    throw new AppError(status.BAD_REQUEST, 'Invalid session');
  }

  const startDate = new Date();
  const endDate = new Date();

  if (planType === 'MONTHLY') endDate.setMonth(endDate.getMonth() + 1);
  if (planType === 'YEARLY') endDate.setFullYear(endDate.getFullYear() + 1);

  await prisma.subscription.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: { status: 'CANCELLED' },
  });

  return prisma.subscription.create({
    data: {
      userId,
      planType,
      status: 'ACTIVE',
      paymentStatus: 'PAID',
      stripeId: session.subscription as string,
      startDate,
      endDate,
    },
  });
};

/* ================= GET ACTIVE ================= */

const getActiveSubscription = async (user: IRequestUser) => {
  const { userId } = user;

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (!subscription) {
    return { isSubscribed: false, data: null };
  }

  if (subscription.endDate && new Date() > subscription.endDate) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'EXPIRED' },
    });

    return { isSubscribed: false, data: null };
  }

  return { isSubscribed: true, data: subscription };
};

/* ================= CANCEL ================= */

const cancelSubscription = async (
  user: IRequestUser,
  subscriptionId: string,
) => {
  const { userId } = user;

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError(status.NOT_FOUND, 'Subscription not found');
  }

  if (subscription.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'Not allowed');
  }

  if (subscription.stripeId) {
    try {
      await stripe.subscriptions.cancel(subscription.stripeId);
    } catch (error) {
      console.error('Stripe cancellation error:', error);
    }
  }

  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      endDate: new Date(),
    },
  });
};

/* ================= GET ALL ================= */

const getAllSubscriptions = async () => {
  const data = await prisma.subscription.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return data;
};

export const subscriptionService = {
  createSubscription,
  confirmSubscription,
  getActiveSubscription,
  cancelSubscription,
  getAllSubscriptions,
};
