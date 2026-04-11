import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import status from 'http-status';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { deleteFileFromCloudinary } from '../../config/cloudinary.config.js';
import { IUserUpdatePayload } from './user.interface.js';

/* ================= HELPERS ================= */

const getMonthName = (date: Date) =>
  date.toLocaleString('en-US', { month: 'short' });

/* ================= USER DASHBOARD ================= */

const getUserDashboard = async (user: IRequestUser) => {
  const userId = user.userId;

  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!userData) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  const [
    totalReviews,
    totalPurchases,
    watchlistCount,
    totalSpent,
    recentReviews,
    recentPurchases,
  ] = await Promise.all([
    prisma.review.count({ where: { userId } }),

    prisma.purchase.count({ where: { userId } }),

    prisma.watchlist.count({ where: { userId } }),

    prisma.purchase.aggregate({
      where: { userId, status: 'ACTIVE' },
      _sum: { amount: true },
    }),

    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        movie: { select: { title: true, thumbnail: true } },
      },
    }),

    prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        movie: { select: { title: true, thumbnail: true } },
      },
    }),
  ]);

  return {
    user: userData,
    stats: {
      totalReviews,
      totalPurchases,
      watchlistCount,
      totalSpent: totalSpent._sum.amount || 0,
    },
    recentReviews,
    recentPurchases,
  };
};

/* ================= USER ANALYTICS ================= */

const getUserAnalytics = async (user: IRequestUser) => {
  const userId = user.userId;

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      movie: { select: { genre: true } },
    },
  });

  const genreCount: Record<string, number> = {};
  const monthCount: Record<string, number> = {};

  reviews.forEach(r => {
    const month = getMonthName(r.createdAt);

    monthCount[month] = (monthCount[month] || 0) + 1;

    r.movie.genre.forEach((g: string) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  /* ================= ACTIVITY ================= */

  const activityData = Object.entries(monthCount).map(([name, reviews]) => ({
    name,
    reviews,
    watchHours: reviews * 2,
  }));

  /* ================= GENRE ================= */

  const genreData = Object.entries(genreCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  /* ================= ENGAGEMENT ================= */

  const engagementData = activityData.slice(0, 7).map((a, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || 'Day',
    score: Math.min(a.reviews * 20, 100),
  }));

  return {
    activityData,
    engagementData,
    genreData,
  };
};

/* ================= USER STATS ================= */

const getUserStats = async (user: IRequestUser) => {
  const { userId } = user;

  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!userData) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  const reviewsStats = await prisma.review.aggregate({
    where: { userId },
    _count: { id: true },
    _avg: { rating: true },
  });

  const purchasesStats = await prisma.purchase.aggregate({
    where: { userId, status: 'ACTIVE' },
    _count: { id: true },
    _sum: { amount: true },
  });

  const favoriteGenresData = await prisma.review.findMany({
    where: { userId },
    select: {
      movie: {
        select: {
          genre: true,
        },
      },
    },
    take: 100,
  });

  const genreCount: Record<string, number> = {};

  favoriteGenresData.forEach(review => {
    review.movie.genre.forEach((g: string) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({
      genre,
      count,
    }));

  return {
    user: userData,
    reviews: {
      total: reviewsStats._count.id,
      averageRating: reviewsStats._avg.rating || 0,
    },
    purchases: {
      total: purchasesStats._count.id,
      totalSpent: purchasesStats._sum.amount || 0,
    },
    topGenres,
  };
};

/* ================= PROFILE ================= */

const getUserProfile = async (user: IRequestUser) => {
  const data = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!data) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  return data;
};

/* ================= UPDATE PROFILE ================= */

const updateUserProfile = async (
  user: IRequestUser,
  payload: IUserUpdatePayload,
) => {
  const { userId } = user;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  let imageUrl = existingUser.image;

  if (payload.image) {
    imageUrl = payload.image;

    if (existingUser.image) {
      await deleteFileFromCloudinary(existingUser.image);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
      email: payload.email,
      image: imageUrl,
    },
  });

  return updatedUser;
};
/* ================= GET ALL USERS ================= */

const getAllUsers = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.user, query, {
    searchableFields: ['name', 'email'],
    filterableFields: ['role', 'status'],
  });

  const result = await queryBuilder.filter().paginate().sort().execute();

  return result;
};

/* ================= EXPORT ================= */

export const userService = {
  getUserDashboard,
  getUserAnalytics,
  getUserStats,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
};
