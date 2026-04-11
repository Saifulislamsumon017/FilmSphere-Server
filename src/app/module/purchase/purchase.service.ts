import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { stripe } from '../../config/stripe.config.js';
import { envVars } from '../../config/env.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';

import {
  PurchaseStatus,
  PurchaseType,
  UserRole,
} from '../../../generated/prisma/enums.js';

import {
  ICreatePurchase,
  IPurchaseCheckout,
  IPurchaseConfirm,
} from './purchase.interface.js';

import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { Prisma, Purchase } from '../../../generated/prisma/client.js';
import { mapPurchaseToResponse } from './purchase.mapper.js';
import {
  purchaseSearchableFields,
  purchaseFilterableFields,
} from './purchase.constant.js';

/* ================= CREATE CHECKOUT ================= */
const createPurchaseCheckout = async (
  user: IRequestUser,
  payload: ICreatePurchase,
): Promise<IPurchaseCheckout> => {
  const movie = await prisma.movie.findUnique({
    where: { id: payload.movieId },
  });

  if (!movie) throw new AppError(status.NOT_FOUND, 'Movie not found');

  const existing = await prisma.purchase.findFirst({
    where: {
      userId: user.userId,
      movieId: payload.movieId,
      purchaseType: payload.purchaseType,
      status: PurchaseStatus.ACTIVE,
    },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, 'Already purchased');
  }

  const amount =
    payload.purchaseType === PurchaseType.BUY
      ? movie.buyPrice
      : movie.rentPrice;

  if (!amount || amount <= 0) {
    throw new AppError(status.BAD_REQUEST, 'Invalid price');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${movie.title} (${payload.purchaseType})`,
            images: movie.thumbnail ? [movie.thumbnail] : [],
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${envVars.FRONTEND_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${envVars.FRONTEND_URL}/purchase/cancel`,
    customer_email: user.email,
    metadata: {
      userId: user.userId,
      movieId: payload.movieId,
      purchaseType: payload.purchaseType,
    },
  });

  return {
    success: true,
    message: 'Checkout created',
    checkoutUrl: session.url!,
    sessionId: session.id,
  };
};

/* ================= CONFIRM ================= */
const confirmPurchase = async (
  sessionId: string,
): Promise<IPurchaseConfirm> => {
  const existing = await prisma.purchase.findFirst({
    where: { stripeTransactionId: sessionId },
  });

  if (existing) {
    return {
      success: true,
      message: 'Already confirmed',
      data: mapPurchaseToResponse(existing),
    };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError(status.BAD_REQUEST, 'Payment not completed');
  }

  const { userId, movieId, purchaseType } = session.metadata || {};

  if (!userId || !movieId || !purchaseType) {
    throw new AppError(status.BAD_REQUEST, 'Invalid metadata');
  }

  const expiresAt =
    purchaseType === PurchaseType.RENT
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : null;

  const purchase = await prisma.purchase.create({
    data: {
      userId,
      movieId,
      purchaseType: purchaseType as PurchaseType,
      status: PurchaseStatus.ACTIVE,
      paymentStatus: 'PAID',
      amount: session.amount_total ? session.amount_total / 100 : 0,
      stripeTransactionId: session.id,
      expiresAt,
    },
  });

  return {
    success: true,
    message: 'Purchase successful',
    data: mapPurchaseToResponse(purchase),
  };
};

/* ================= GET ALL ================= */
const getAllPurchases = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Purchase,
    Prisma.PurchaseWhereInput,
    Prisma.PurchaseInclude
  >(prisma.purchase, query, {
    searchableFields: purchaseSearchableFields,
    filterableFields: purchaseFilterableFields,
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

/* ================= HISTORY ================= */
const getPurchaseHistory = async (user: IRequestUser, query: IQueryParams) => {
  return getAllPurchases({ ...query, userId: user.userId });
};

/* ================= CHECK ================= */
const checkPurchase = async (user: IRequestUser, movieId: string) => {
  if (user.role === UserRole.ADMIN) {
    return { isPurchased: true };
  }

  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: user.userId,
      movieId,
      status: PurchaseStatus.ACTIVE,
    },
  });

  if (!purchase) return { isPurchased: false };

  if (
    purchase.purchaseType === PurchaseType.RENT &&
    purchase.expiresAt &&
    new Date() > new Date(purchase.expiresAt)
  ) {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: PurchaseStatus.EXPIRED },
    });

    return { isPurchased: false };
  }

  return {
    isPurchased: true,
    purchaseType: purchase.purchaseType,
  };
};

/* ================= CANCEL ================= */
const cancelPurchases = async (user: IRequestUser, purchaseId: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) throw new AppError(status.NOT_FOUND, 'Purchase not found');

  if (purchase.userId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'Unauthorized');
  }

  if (purchase.purchaseType !== PurchaseType.RENT) {
    throw new AppError(status.BAD_REQUEST, 'Only rental cancel allowed');
  }

  return prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.CANCELLED,
      expiresAt: new Date(),
    },
  });
};

export const purchaseService = {
  createPurchaseCheckout,
  confirmPurchase,
  getAllPurchases,
  getPurchaseHistory,
  checkPurchase,
  cancelPurchases,
};
