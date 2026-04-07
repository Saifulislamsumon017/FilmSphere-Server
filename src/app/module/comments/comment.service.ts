import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';

import {
  ICreateCommentPayload,
  IUpdateCommentPayload,
} from './comment.interface.js';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { Prisma, Comment } from '../../../generated/prisma/client.js';

/* ================= CREATE ================= */

const createComment = async (
  user: IRequestUser,
  payload: ICreateCommentPayload,
) => {
  const { userId } = user;

  const comment = await prisma.comment.create({
    data: {
      reviewId: payload.reviewId,
      userId,
      content: payload.content,
      parentCommentId: payload.parentCommentId,
    },
  });

  await prisma.review.update({
    where: { id: payload.reviewId },
    data: { commentCount: { increment: 1 } },
  });

  return comment;
};

/* ================= GET BY REVIEW ================= */

const getCommentsByReview = async (payload: ICreateCommentPayload) => {
  const { reviewId } = payload;
  const comments = await prisma.comment.findMany({
    where: {
      reviewId,
      parentCommentId: null,
    },
    include: {
      user: { select: { id: true, name: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return comments;
};

/* ================= GET ALL ================= */

const getAllComments = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Comment,
    Prisma.CommentWhereInput,
    Prisma.CommentInclude
  >(prisma.comment, query, {
    searchableFields: ['content'],
    filterableFields: ['reviewId', 'userId'],
  });

  const result = await queryBuilder
    .filter()
    .include({
      user: { select: { name: true } },
      replies: true,
    })
    .paginate()
    .sort()
    .execute();

  return result;
};

/* ================= GET SINGLE ================= */

const getCommentById = async (commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: { select: { id: true, name: true } },
      replies: true,
    },
  });

  if (!comment) {
    throw new AppError(status.NOT_FOUND, 'Comment not found');
  }

  return comment;
};

/* ================= UPDATE ================= */

const updateComment = async (
  user: IRequestUser,
  commentId: string,
  payload: IUpdateCommentPayload,
) => {
  const { userId } = user;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(status.NOT_FOUND, 'Comment not found');
  }

  if (comment.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'Not allowed');
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { content: payload.content },
  });
};

/* ================= DELETE ================= */

const deleteComment = async (user: IRequestUser, commentId: string) => {
  const { userId } = user;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(status.NOT_FOUND, 'Comment not found');
  }

  if (comment.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'Not allowed');
  }

  const replyCount = await prisma.comment.count({
    where: { parentCommentId: commentId },
  });

  await prisma.comment.deleteMany({
    where: {
      OR: [{ id: commentId }, { parentCommentId: commentId }],
    },
  });

  await prisma.review.update({
    where: { id: comment.reviewId },
    data: { commentCount: { decrement: 1 + replyCount } },
  });

  return { success: true };
  // return null;
};

export const commentService = {
  createComment,
  getCommentsByReview,
  getAllComments,
  getCommentById,
  updateComment,
  deleteComment,
};
