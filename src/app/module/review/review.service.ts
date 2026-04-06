import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';

import {
  reviewFilterableFields,
  reviewSearchableFields,
} from './review.constant.js';

import {
  ICreateReviewPayload,
  IUpdateReviewPayload,
} from './review.interface.js';

import { updateMovieRating } from './review.utils.js';
import { ReviewStatus } from '../../../generated/prisma/enums.js';
import { Prisma, Review } from '../../../generated/prisma/client.js';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= CREATE ================= */

const createReview = async (
  user: IRequestUser,
  payload: ICreateReviewPayload,
) => {
  const isExist = await prisma.review.findFirst({
    where: {
      userId: user.userId,
      movieId: payload.movieId,
    },
  });

  if (isExist) {
    throw new AppError(status.BAD_REQUEST, 'Already reviewed');
  }

  const review = await prisma.review.create({
    data: {
      ...payload,
      userId: user.userId,
      status:
        user.role === 'ADMIN' ? ReviewStatus.APPROVED : ReviewStatus.PENDING,
    },
  });

  if (review.status === ReviewStatus.APPROVED) {
    await updateMovieRating(payload.movieId);
  }

  return review;
};

/* ================= GET ALL ================= */

const getAllReviews = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Review,
    Prisma.ReviewWhereInput,
    Prisma.ReviewInclude
  >(prisma.review, query, {
    searchableFields: reviewSearchableFields,
    filterableFields: reviewFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({ isDeleted: false })
    .include({
      user: { select: { name: true, image: true } },
      movie: { select: { title: true, thumbnail: true } },
    })
    .paginate()
    .sort()
    .execute();

  return result;
};

/* ================= GET BY ID ================= */

const getReviewById = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: true,
      movie: true,
      comments: true,
      likes: true,
    },
  });

  if (!review) throw new AppError(status.NOT_FOUND, 'Review not found');

  return review;
};

/* ================= GET BY MOVIE ================= */

const getReviewsByMovieId = async (movieId: string, query: IQueryParams) => {
  return getAllReviews({
    ...query,
    movieId,
    status: ReviewStatus.APPROVED,
  });
};

/* ================= UPDATE ================= */

const updateReview = async (
  id: string,
  user: IRequestUser,
  payload: IUpdateReviewPayload,
) => {
  const isExist = await prisma.review.findUnique({
    where: { id },
  });

  if (!isExist) throw new AppError(status.NOT_FOUND, 'Review not found');

  if (isExist.userId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'Not allowed');
  }

  if (isExist.status === ReviewStatus.APPROVED) {
    throw new AppError(status.BAD_REQUEST, 'Cannot edit approved');
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...payload,
      status: ReviewStatus.PENDING,
    },
  });

  return updated;
};

/* ================= DELETE ================= */

const deleteReview = async (id: string, user: IRequestUser) => {
  const isExist = await prisma.review.findUnique({
    where: { id },
  });

  if (!isExist) throw new AppError(status.NOT_FOUND, 'Review not found');

  if (isExist.userId !== user.userId) {
    throw new AppError(status.FORBIDDEN, 'Not allowed');
  }

  const deleted = await prisma.review.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await updateMovieRating(isExist.movieId);

  return deleted;
};

/* ================= ADMIN ================= */

const getPendingReviews = async (query: IQueryParams) => {
  return getAllReviews({
    ...query,
    status: ReviewStatus.PENDING,
  });
};

const approveReview = async (id: string) => {
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) throw new AppError(status.NOT_FOUND, 'Review not found');

  const updated = await prisma.review.update({
    where: { id },
    data: { status: ReviewStatus.APPROVED },
  });

  await updateMovieRating(review.movieId);

  return updated;
};

const rejectReview = async (id: string, reason?: string) => {
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) throw new AppError(status.NOT_FOUND, 'Review not found');

  return prisma.review.update({
    where: { id },
    data: {
      status: ReviewStatus.REJECTED,
      rejectionReason: reason,
    },
  });
};

/* ================= EXTRA ================= */

const getRecentApprovedReviews = async (limit = 10) => {
  return prisma.review.findMany({
    where: {
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { name: true, image: true } },
      movie: { select: { title: true, thumbnail: true } },
    },
  });
};

const syncRatings = async () => {
  const movies = await prisma.movie.findMany({ select: { id: true } });

  for (const m of movies) {
    await updateMovieRating(m.id);
  }

  return { success: true };
};

export const reviewService = {
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
