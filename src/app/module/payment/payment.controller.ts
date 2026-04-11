import { Request, Response } from 'express';
import status from 'http-status';

import { stripe } from '../../config/stripe.config.js';
import { envVars } from '../../config/env.js';

import { paymentService } from './payment.service.js';

import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';

import { IQueryParams } from '../../interfaces/query.interface.js';

const createCheckout = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await paymentService.createCheckout(user, payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Checkout created',
    data: result,
  });
});

const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET,
    );

    const result = await paymentService.handleStripeWebhookEvent(event);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: 'Stripe webhook processed',
      data: result,
    });
  },
);

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await paymentService.refundPayment(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Refund successful',
    data: result,
  });
});

const myPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const query = req.query;

  const result = await paymentService.myPayment(user, query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'My purchases',
    data: result.data,
    meta: result.meta,
  });
});

const getAllPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await paymentService.getAllPayment(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'All purchases',
    data: result.data,
    meta: result.meta,
  });
});

export const paymentController = {
  createCheckout,
  handleStripeWebhookEvent,
  refundPayment,
  getAllPayment,
  myPayment,
};
