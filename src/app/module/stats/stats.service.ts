/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Review } from '../../../generated/prisma/client.js';
import {
  PurchaseStatus,
  ReviewStatus,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from '../../../generated/prisma/enums.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';

/* =========================
   ADMIN DASHBOARD STATS
========================= */
const getAdminStatsData = async () => {
  const [
    totalMovies,
    totalUsers,
    totalAdmins,
    activeUsers,
    bannedUsers,
    deletedUsers,
    totalReviews,
    totalSubscriptions,
    totalPurchases,
    pendingReviews,
    purchaseRevenue,
    topRatedMovies,
    mostReviewedMovies,
    recentUsers,
  ] = await Promise.all([
    prisma.movie.count(),

    prisma.user.count({ where: { role: UserRole.USER } }),

    prisma.user.count({ where: { role: UserRole.ADMIN } }),

    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),

    prisma.user.count({ where: { status: UserStatus.BANNED } }),

    prisma.user.count({ where: { status: UserStatus.DELETED } }),

    prisma.review.count(),

    prisma.subscription.count({
      where: { status: SubscriptionStatus.ACTIVE },
    }),

    prisma.purchase.count({
      where: { status: PurchaseStatus.ACTIVE },
    }),

    prisma.review.count({
      where: { status: ReviewStatus.PENDING },
    }),

    prisma.purchase.aggregate({
      _sum: { amount: true },
    }),

    prisma.movie.findMany({
      orderBy: { avgRating: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        avgRating: true,
        reviewCount: true,
        thumbnail: true,
      },
    }),

    prisma.movie.findMany({
      orderBy: { reviewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        reviewCount: true,
        avgRating: true,
        thumbnail: true,
      },
    }),

    prisma.user.findMany({
      where: { role: UserRole.USER },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        image: true,
      },
    }),
  ]);

  return {
    totalMovies,
    totalUsers,
    totalAdmins,
    usersByStatus: {
      active: activeUsers,
      banned: bannedUsers,
      deleted: deletedUsers,
    },
    totalReviews,
    totalSubscriptions,
    totalPurchases,
    revenue: purchaseRevenue._sum.amount || 0,
    pendingReviews,
    topRatedMovies,
    mostReviewedMovies,
    recentUsers,
  };
};

/* =========================
   USER DASHBOARD STATS
========================= */
const getUserStatsData = async (userId: string) => {
  const userReviews = await prisma.review.count({
    where: { userId },
  });

  const userPurchases = await prisma.purchase.count({
    where: {
      userId,
      status: PurchaseStatus.ACTIVE,
    },
  });

  const userSubscriptions = await prisma.subscription.count({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  const latestActivity = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      movie: { select: { title: true } },
    },
  });

  return {
    userReviews,
    userPurchases,
    userSubscriptions,
    latestActivity,
  };
};

/* =========================
   ROLE BASED MAIN SERVICE
========================= */
const getDashboardStatsData = async (user: IRequestUser) => {
  if (user.role === UserRole.ADMIN) {
    return getAdminStatsData();
  }

  if (user.role === UserRole.USER) {
    return getUserStatsData(user.userId);
  }

  throw new Error('Invalid role');
};

/* =========================
   CHART DATA (7 DAYS)
========================= */
const getChartData = async () => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const [userStats, revenueStats] = await Promise.all([
    Promise.all(
      last7Days.map(async date => {
        const count = await prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(date),
              lt: new Date(new Date(date).getTime() + 86400000),
            },
          },
        });

        return { date, users: count };
      }),
    ),

    Promise.all(
      last7Days.map(async date => {
        const result = await prisma.purchase.aggregate({
          where: {
            status: PurchaseStatus.ACTIVE,
            updatedAt: {
              gte: new Date(date),
              lt: new Date(new Date(date).getTime() + 86400000),
            },
          },
          _sum: { amount: true },
        });

        return { date, revenue: result._sum.amount || 0 };
      }),
    ),
  ]);

  return {
    userStats,
    revenueStats,
  };
};

/* =========================
   ACTIVITY LOGS
========================= */
const getActivityLogs = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Review,
    Prisma.ReviewWhereInput,
    Prisma.ReviewInclude
  >(prisma.review, query, {
    searchableFields: [],
    filterableFields: [],
  });

  const result = await queryBuilder
    .where({})
    .sort()
    .paginate()
    .include({
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      movie: {
        select: {
          title: true,
        },
      },
    })
    .execute();

  const formatted = result.data.map((log: any) => ({
    id: log.id,
    userId: log.userId,
    action: 'Created Review',
    entityType: 'Movie',
    entityId: log.movieId,
    entityName: log.movie.title,
    userAction: `${log.user.name} rated "${log.movie.title}" with ${log.rating} stars`,
    createdAt: log.createdAt,
    user: log.user,
  }));

  return {
    data: formatted,
    meta: result.meta,
  };
};
/* =========================
   PENDING REVIEWS
========================= */
const getPendingReviews = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Review,
    Prisma.ReviewWhereInput,
    Prisma.ReviewInclude
  >(prisma.review, query, {
    searchableFields: [],
    filterableFields: [],
  });

  const result = await queryBuilder
    .where({
      status: ReviewStatus.PENDING,
    })
    .sort()
    .paginate()
    .include({
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      movie: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
    })
    .execute();

  return {
    data: result.data,
    meta: result.meta,
  };
};

/* =========================
   REVIEW ACTIONS
========================= */
const approveReview = async (reviewId: string) => {
  return prisma.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.APPROVED },
  });
};

const rejectReview = async (reviewId: string, reason?: string) => {
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      status: ReviewStatus.REJECTED,
      rejectionReason: reason || null,
    },
  });
};

export const StatsService = {
  getDashboardStatsData,
  getChartData,
  getActivityLogs,
  getPendingReviews,
  approveReview,
  rejectReview,
};
