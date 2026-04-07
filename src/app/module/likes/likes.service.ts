import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';

import {
  likeFilterableFields,
  likeSearchableFields,
} from './likes.constant.js';

import { Prisma, Like } from '../../../generated/prisma/client.js';

import { ICreateLikePayload } from './likes.interface.js';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= LIKE ================= */

const likeReview = async (user: IRequestUser, payload: ICreateLikePayload) => {
  const { userId } = user;
  const { reviewId } = payload;

  const existing = await prisma.like.findUnique({
    where: {
      uniq_user_review_like: {
        userId,
        reviewId,
      },
    },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, 'Already liked');
  }

  await prisma.like.create({
    data: { userId, reviewId },
  });

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { likesCount: { increment: 1 } },
    select: { likesCount: true },
  });

  return review;
};

/* ================= UNLIKE ================= */

const unlikeReview = async (
  user: IRequestUser,
  payload: ICreateLikePayload,
) => {
  const { userId } = user;
  const { reviewId } = payload;

  const existing = await prisma.like.findUnique({
    where: {
      uniq_user_review_like: {
        userId,
        reviewId,
      },
    },
  });

  if (!existing) {
    throw new AppError(status.BAD_REQUEST, 'Not liked yet');
  }

  await prisma.like.delete({
    where: {
      uniq_user_review_like: {
        userId,
        reviewId,
      },
    },
  });

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { likesCount: { decrement: 1 } },
    select: { likesCount: true },
  });

  return review;
};

/* ================= CHECK ================= */

const isLiked = async (user: IRequestUser, payload: ICreateLikePayload) => {
  const { userId } = user;
  const { reviewId } = payload;

  const like = await prisma.like.findUnique({
    where: {
      uniq_user_review_like: {
        userId,
        reviewId,
      },
    },
  });

  return { isLiked: !!like };
};

/* ================= GET ALL ================= */

const getAllLikes = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Like,
    Prisma.LikeWhereInput,
    Prisma.LikeInclude
  >(prisma.like, query, {
    searchableFields: likeSearchableFields,
    filterableFields: likeFilterableFields,
  });

  const result = await queryBuilder
    .filter()
    .include({
      user: { select: { name: true, image: true } },
      review: { select: { id: true, content: true } },
    })
    .paginate()
    .sort()
    .execute();

  return result;
};

/* ================= Toggle Like ================= */

const toggleLike = async (user: IRequestUser, payload: ICreateLikePayload) => {
  const { userId } = user;
  const { reviewId } = payload;

  const existing = await prisma.like.findUnique({
    where: {
      uniq_user_review_like: {
        userId,
        reviewId,
      },
    },
  });

  if (existing) {
    // UNLIKE
    await prisma.like.delete({
      where: {
        uniq_user_review_like: {
          userId,
          reviewId,
        },
      },
    });

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { likesCount: { decrement: 1 } },
      select: { likesCount: true },
    });

    return { liked: false, ...review };
  } else {
    // LIKE
    await prisma.like.create({
      data: { userId, reviewId },
    });

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    });

    return { liked: true, ...review };
  }
};

export const likeService = {
  likeReview,
  unlikeReview,
  isLiked,
  getAllLikes,
  toggleLike,
};
