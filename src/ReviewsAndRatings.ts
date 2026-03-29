import { prisma } from './app/lib/prisma.js';

async function finalizeReviewsAndRatings() {
  console.log('🔄 Running review approvals & movie rating updates...');

  try {
    // ✅ Approve all pending reviews
    const approvedRes = await prisma.review.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' },
    });
    console.log(`👍 ${approvedRes.count} reviews now APPROVED.`);

    // 🔎 Get all movies
    const movieList = await prisma.movie.findMany({ select: { id: true } });

    for (const movieItem of movieList) {
      // 📋 Get approved reviews for this movie
      const movieReviews = await prisma.review.findMany({
        where: { movieId: movieItem.id, status: 'APPROVED' },
        select: { rating: true },
      });

      if (movieReviews.length > 0) {
        const totalRating = movieReviews.reduce(
          (acc: number, r: { rating: number }) => acc + r.rating,
          0,
        );
        const avgRating = totalRating / movieReviews.length;

        await prisma.movie.update({
          where: { id: movieItem.id },
          data: {
            avgRating: Math.round(avgRating * 10) / 10,
            reviewCount: movieReviews.length,
          },
        });

        console.log(
          `🎬 Movie ${movieItem.id}: Avg ${avgRating.toFixed(
            1,
          )} (${movieReviews.length} reviews)`,
        );
      } else {
        // No approved reviews → reset
        await prisma.movie.update({
          where: { id: movieItem.id },
          data: { avgRating: 0, reviewCount: 0 },
        });
      }
    }

    console.log('✅ Movie ratings and review counts synced!');
  } catch (err) {
    console.error('❌ Error during review/rating sync:', err);
  }
}

finalizeReviewsAndRatings()
  .catch(e => console.error('💥 Fatal error:', e))
  .finally(async () => await prisma.$disconnect());
