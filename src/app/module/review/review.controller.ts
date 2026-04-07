import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { reviewService } from './review.service.js';

import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= CREATE ================= */

const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await reviewService.createReview(user, payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

/* ================= GET ALL ================= */

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await reviewService.getAllReviews(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Reviews fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

/* ================= GET BY ID ================= */

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await reviewService.getReviewById(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review fetched successfully',
    data: result,
  });
});

/* ================= GET BY MOVIE ================= */

const getReviewsByMovieId = catchAsync(async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const result = await reviewService.getReviewsByMovieId(
    movieId as string,
    req.query as IQueryParams,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Movie reviews successfully',
    data: result.data,
    meta: result.meta,
  });
});

/* ================= UPDATE ================= */

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const payload = req.body;
  const result = await reviewService.updateReview(id as string, user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review updated successfully ',
    data: result,
  });
});

/* ================= DELETE ================= */

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  const result = await reviewService.deleteReview(id as string, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

/* ================= ADMIN ================= */

const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.getPendingReviews(
    req.query as IQueryParams,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review pending',
    data: result.data,
    meta: result.meta,
  });
});

const approveReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await reviewService.approveReview(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review approved successfully',
    data: result,
  });
});

const rejectReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await reviewService.rejectReview(
    id as string,
    req.body.reason,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review rejected successfully',
    data: result,
  });
});

/* ================= EXTRA ================= */

const getRecentApprovedReviews = catchAsync(
  async (req: Request, res: Response) => {
    const result = await reviewService.getRecentApprovedReviews();

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: 'Recent reviews fetched successfully',
      data: result,
    });
  },
);

const syncRatings = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.syncRatings();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Synced rating successfully',
    data: result,
  });
});

export const reviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewsByMovieId,
  updateReview,
  deleteReview,
  getPendingReviews,
  approveReview,
  rejectReview,
  getRecentApprovedReviews,
  syncRatings,
};
