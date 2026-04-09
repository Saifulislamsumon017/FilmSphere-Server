import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';

import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { Prisma, Watchlist } from '../../../generated/prisma/client.js';
import {
  watchlistSearchableFields,
  watchlistFilterableFields,
} from './watchlist.constant.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= ADD ================= */

const addToWatchlist = async (user: IRequestUser, movieId: string) => {
  const { userId } = user;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    throw new AppError(status.NOT_FOUND, 'Movie not found');
  }

  const existing = await prisma.watchlist.findUnique({
    where: {
      uniq_user_movie_watchlist: { userId, movieId },
    },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, 'Already in watchlist');
  }

  return prisma.watchlist.create({
    data: { userId, movieId },
  });
};

/* ================= REMOVE ================= */

const removeFromWatchlist = async (user: IRequestUser, movieId: string) => {
  const { userId } = user;

  const existing = await prisma.watchlist.findUnique({
    where: {
      uniq_user_movie_watchlist: { userId, movieId },
    },
  });

  if (!existing) {
    throw new AppError(status.NOT_FOUND, 'Not in watchlist');
  }

  return prisma.watchlist.delete({
    where: {
      uniq_user_movie_watchlist: { userId, movieId },
    },
  });
};

/* ================= GET ALL (🔥 QueryBuilder) ================= */

const getWatchlist = async (user: IRequestUser, query: IQueryParams) => {
  const { userId } = user;

  // 🔥 override sortBy for watchlist only
  const updatedQuery = {
    ...query,
    sortBy: query.sortBy || 'addedAt', // 👈 IMPORTANT FIX
  };

  const queryBuilder = new QueryBuilder<
    Watchlist,
    Prisma.WatchlistWhereInput,
    Prisma.WatchlistInclude
  >(prisma.watchlist, updatedQuery, {
    searchableFields: watchlistSearchableFields,
    filterableFields: watchlistFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({
      userId,
    })
    .include({
      movie: {
        select: {
          id: true,
          title: true,
          synopsis: true,
          thumbnail: true,
          genre: true,
          releaseYear: true,
          director: true,
          avgRating: true,
        },
      },
    })
    .paginate()
    .sort()
    .fields()
    .execute();

  return result;
};

/* ================= CHECK ================= */

const isInWatchlist = async (user: IRequestUser, movieId: string) => {
  const { userId } = user;

  const watchlist = await prisma.watchlist.findUnique({
    where: {
      uniq_user_movie_watchlist: { userId, movieId },
    },
  });

  return {
    isInWatchlist: !!watchlist,
  };
};

export const watchlistService = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist,
};
