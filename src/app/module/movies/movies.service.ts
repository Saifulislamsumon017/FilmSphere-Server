import status from 'http-status';
import { ICreateMovie, IUpdateMovie } from './movies.interface.js';
import { stripe } from '../../config/stripe.config.js';
import { prisma } from '../../lib/prisma.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { Movie, Prisma } from '../../../generated/prisma/client.js';
import {
  movieFilterableFields,
  movieIncludeConfig,
  movieSearchableFields,
} from './movies.constant.js';
import AppError from '../../errorHelpers/AppError.js';
import { deleteFileFromCloudinary } from '../../config/cloudinary.config.js';

/* ================= CREATE ================= */

const createMovie = async (payload: ICreateMovie) => {
  let stripeBuyPriceId: string | null = null;
  let stripeRentPriceId: string | null = null;

  if (payload.pricing === 'PREMIUM') {
    const product = await stripe.products.create({
      name: payload.title,
      description: payload.synopsis,
      images: payload.thumbnail ? [payload.thumbnail] : [],
    });

    if (payload.buyPrice) {
      const buy = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(payload.buyPrice * 100),
        currency: 'usd',
      });
      stripeBuyPriceId = buy.id;
    }

    if (payload.rentPrice) {
      const rent = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(payload.rentPrice * 100),
        currency: 'usd',
      });
      stripeRentPriceId = rent.id;
    }
  }

  return prisma.movie.create({
    data: {
      ...payload,
      stripeBuyPriceId,
      stripeRentPriceId,
    },
  });
};

/* ================= GET ALL ================= */

const getAllMovies = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Movie,
    Prisma.MovieWhereInput,
    Prisma.MovieInclude
  >(prisma.movie, query, {
    searchableFields: movieSearchableFields,
    filterableFields: movieFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({
      isDeleted: false,
    })
    .include({
      reviews: true,
      watchlists: true,
      purchases: true,
    })

    .dynamicInclude(movieIncludeConfig)
    .paginate()
    .sort()
    .fields()
    .execute();

  // console.log(result);
  return result;
};

/* ================= GET BY ID ================= */

const getMovieById = async (id: string) => {
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      reviews: true,
    },
  });

  if (!movie) throw new AppError(status.NOT_FOUND, 'Movie not found');

  return movie;
};

/* ================= UPDATE ================= */

const updateMovie = async (id: string, payload: IUpdateMovie) => {
  const exist = await prisma.movie.findUnique({ where: { id } });

  if (!exist) throw new AppError(status.NOT_FOUND, 'Movie not found');

  // only delete old image if new uploaded image
  if (
    payload.thumbnail &&
    exist.thumbnail &&
    payload.thumbnail !== exist.thumbnail
  ) {
    await deleteFileFromCloudinary(exist.thumbnail);
  }

  return prisma.movie.update({
    where: { id },
    data: payload,
  });
};

/* ================= DELETE ================= */

const deleteMovie = async (id: string) => {
  const movie = await prisma.movie.findUnique({ where: { id } });

  if (!movie) throw new AppError(status.NOT_FOUND, 'Movie not found');

  if (movie.stripeBuyPriceId) {
    await stripe.prices.update(movie.stripeBuyPriceId, { active: false });
  }

  if (movie.stripeRentPriceId) {
    await stripe.prices.update(movie.stripeRentPriceId, { active: false });
  }

  // 🔥 Delete thumbnail from Cloudinary
  if (movie.thumbnail) {
    await deleteFileFromCloudinary(movie.thumbnail);
  }

  return prisma.movie.delete({ where: { id } });
};

/* ================= EXTRA ================= */

const getFeaturedMovies = async () => {
  return prisma.movie.findMany({
    where: { avgRating: { gte: 1 } },
    orderBy: { avgRating: 'desc' },
    take: 10,
  });
};

const getNewReleases = async () => {
  return prisma.movie.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
};

const getComingSoon = async () => {
  const year = new Date().getFullYear();

  return prisma.movie.findMany({
    where: { releaseYear: { gt: year } },
  });
};

const getEditorsPicks = async () => {
  return prisma.movie.findMany({
    where: { avgRating: { gte: 8 } },
  });
};

export const movieService = {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  getFeaturedMovies,
  getNewReleases,
  getComingSoon,
  getEditorsPicks,
};
