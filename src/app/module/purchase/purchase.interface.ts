import {
  PurchaseStatus,
  PurchaseType,
} from '../../../generated/prisma/enums.js';

export interface ICreatePurchase {
  movieId: string;
  purchaseType: PurchaseType;
}

export interface IPurchaseResponse {
  id: string;
  userId: string;
  movieId: string;
  purchaseType: PurchaseType;
  status: PurchaseStatus;
  amount: number;
  stripeTransactionId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseCheckout {
  success: boolean;
  message: string;
  checkoutUrl?: string;
  sessionId?: string;
}

export interface IPurchaseConfirm {
  success: boolean;
  message: string;
  data?: IPurchaseResponse;
}
