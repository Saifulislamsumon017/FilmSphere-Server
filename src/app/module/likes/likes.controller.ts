import { Request, Response } from 'express';
import status from 'http-status';
import { likeService } from './likes.service.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= LIKE ================= */

const likeReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await likeService.likeReview(user, payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Liked successfully',
    data: result,
  });
});

/* ================= UNLIKE ================= */

const unlikeReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await likeService.unlikeReview(user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Unliked successfully',
    data: result,
  });
});

/* ================= CHECK ================= */

const isLiked = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await likeService.isLiked(user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Like status fetched',
    data: result,
  });
});

/* ================= GET ALL ================= */

const getAllLikes = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await likeService.getAllLikes(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Likes fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const result = await likeService.toggleLike(user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Toggled like successfully',
    data: result,
  });
});

export const likeController = {
  likeReview,
  unlikeReview,
  isLiked,
  getAllLikes,
  toggleLike,
};
