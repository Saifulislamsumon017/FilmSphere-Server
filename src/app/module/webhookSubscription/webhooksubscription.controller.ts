import { Request, Response } from 'express';
import status from 'http-status';
import { stripe } from '../../config/stripe.config.js';
import { envVars } from '../../config/env.js';

import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { subscriptionService } from './webhooksubscription.service.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= CREATE ================= */

const createCheckoutSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const payload = req.body;
    const result = await subscriptionService.createCheckoutSubscription(
      user,
      payload,
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: 'Subscription checkout created',
      data: result,
    });
  },
);

/* ================= WEBHOOK ================= */

const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET,
    );

    const result = await subscriptionService.handleStripeWebhookEvent(event);

    res.status(200).json(result);
  },
);

/* ================= MY ================= */

const mySubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const result = await subscriptionService.mySubscription(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'My subscription',
    data: result,
  });
});

/* ================= ALL ================= */

const getAllSubscription = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await subscriptionService.getAllSubscription(
    query as IQueryParams,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'All subscriptions',
    data: result.data,
    meta: result.meta,
  });
});

/* ================= CANCEL ================= */

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const result = await subscriptionService.cancelSubscription(
    id as string,
    user,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Cancelled',
    data: result,
  });
});

export const subscriptionController = {
  createCheckoutSubscription,
  handleStripeWebhookEvent,
  mySubscription,
  getAllSubscription,
  cancelSubscription,
};
