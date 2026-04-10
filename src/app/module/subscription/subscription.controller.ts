import { Request, Response } from 'express';
import status from 'http-status';
import { subscriptionService } from './subscription.service.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';

/* ================= CREATE ================= */

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const result = await subscriptionService.createSubscription(user, payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Checkout session created',
    data: result,
  });
});

/* ================= CONFIRM ================= */

const confirmSubscription = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await subscriptionService.confirmSubscription(payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Subscription activated',
    data: result,
  });
});

/* ================= ACTIVE ================= */

const getActiveSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await subscriptionService.getActiveSubscription(user);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: 'Subscription status',
      data: result,
    });
  },
);

/* ================= CANCEL ================= */

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const result = await subscriptionService.cancelSubscription(
    user,
    id as string,
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Subscription cancelled',
    data: result,
  });
});

/* ================= GET ALL ================= */

const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getAllSubscriptions();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'All subscriptions fetched',
    data: result,
  });
});

export const subscriptionController = {
  createSubscription,
  confirmSubscription,
  getActiveSubscription,
  cancelSubscription,
  getAllSubscriptions,
};
