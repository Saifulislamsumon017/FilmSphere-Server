import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route.js';
import { MovieRoutes } from '../module/movies/movies.route.js';
import { ReviewRoutes } from '../module/review/review.route.js';
import { likeRoutes } from '../module/likes/likes.route.js';
import { commentRoutes } from '../module/comments/comment.route.js';
import { watchlistRoutes } from '../module/watchlist/watchlist.route.js';

const router = Router();

// ---------------- Authentication Routes ----------------

router.use('/auth', AuthRoutes);

// ---------------- Movies Routes ----------------

router.use('/movies', MovieRoutes);

// ---------------- Reviews Routes ----------------

router.use('/reviews', ReviewRoutes);

// ---------------- Like Routes ----------------

router.use('/likes', likeRoutes);

// ---------------- Like Routes ----------------

router.use('/comments', commentRoutes);

// ---------------- Like Routes ----------------

router.use('/watchList', watchlistRoutes);

export const IndexRoutes = router;

/* router.use("/admin", AdminRoutes);

router.use("/subscription", SubscriptionRoutes);

router.use("/purchase", PurchaseRoutes);

router.use("/admin-analytics", AdminAnalyticsRoutes);

router.use("/user", UserRoutes); */
