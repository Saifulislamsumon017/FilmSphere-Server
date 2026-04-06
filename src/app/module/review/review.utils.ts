/* ================= HELPER ================= */

import { ReviewStatus } from '../../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';

export const updateMovieRating = async (movieId: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      movieId,
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    },
    select: { rating: true },
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  await prisma.movie.update({
    where: { id: movieId },
    data: {
      avgRating: Number(avg.toFixed(1)),
      reviewCount: reviews.length,
    },
  });
};
