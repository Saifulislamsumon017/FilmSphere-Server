import { Request, Response } from 'express';
import status from 'http-status';
import { commentService } from './comment.service.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= CREATE ================= */

const createComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const result = await commentService.createComment(user, payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Comment created successfully',
    data: result,
  });
});

/* ================= GET BY REVIEW ================= */

const getCommentsByReview = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await commentService.getCommentsByReview(payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Comments fetched successfully',
    data: result,
  });
});

/* ================= GET ALL ================= */

const getAllComments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await commentService.getAllComments(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Comments fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

/* ================= GET SINGLE ================= */

const getCommentById = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const result = await commentService.getCommentById(commentId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Comment fetched successfully',
    data: result,
  });
});

/* ================= UPDATE ================= */

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const user = req.user;
  const payload = req.body;
  const result = await commentService.updateComment(
    user,
    commentId as string,
    payload,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Comment updated successfully',
    data: result,
  });
});

/* ================= DELETE ================= */

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const user = req.user;
  await commentService.deleteComment(user, commentId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Comment deleted successfully',
    data: null,
  });
});

export const commentController = {
  createComment,
  getCommentsByReview,
  getAllComments,
  getCommentById,
  updateComment,
  deleteComment,
};
