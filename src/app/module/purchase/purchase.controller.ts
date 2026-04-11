import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { purchaseService } from './purchase.service.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

const createPurchaseCheckout = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const payload = req.body;
    const result = await purchaseService.createPurchaseCheckout(user, payload);
    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: result.message,
      data: result,
    });
  },
);

const confirmPurchase = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const result = await purchaseService.confirmPurchase(sessionId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const getAllPurchases = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await purchaseService.getAllPurchases(query as IQueryParams);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Purchases fetched',
    data: result.data,
    meta: result.meta,
  });
});

const getPurchaseHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const query = req.query;
  const result = await purchaseService.getPurchaseHistory(
    user,
    query as IQueryParams,
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Purchase history',
    data: result.data,
    meta: result.meta,
  });
});

const checkPurchase = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { movieId } = req.params;
  const result = await purchaseService.checkPurchase(user, movieId as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Purchase status',
    data: result,
  });
});

const cancelPurchases = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const result = await purchaseService.cancelPurchases(user, id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Rental cancelled',
    data: result,
  });
});

export const purchaseController = {
  createPurchaseCheckout,
  confirmPurchase,
  getAllPurchases,
  getPurchaseHistory,
  checkPurchase,
  cancelPurchases,
};
