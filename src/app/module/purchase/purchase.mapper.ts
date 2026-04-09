import { Purchase } from '../../../generated/prisma/client.js';
import { IPurchaseResponse } from './purchase.interface.js';

export const mapPurchaseToResponse = (
  purchase: Purchase,
): IPurchaseResponse => {
  return {
    id: purchase.id,
    userId: purchase.userId,
    movieId: purchase.movieId,
    purchaseType: purchase.purchaseType,
    status: purchase.status,
    amount: purchase.amount,

    ...(purchase.stripeTransactionId && {
      stripeTransactionId: purchase.stripeTransactionId,
    }),

    ...(purchase.expiresAt && {
      expiresAt: purchase.expiresAt,
    }),

    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
  };
};
