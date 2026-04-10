import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route.js';
import { MovieRoutes } from '../module/movies/movies.route.js';
import { ReviewRoutes } from '../module/review/review.route.js';
import { likeRoutes } from '../module/likes/likes.route.js';
import { commentRoutes } from '../module/comments/comment.route.js';
import { watchlistRoutes } from '../module/watchlist/watchlist.route.js';
import { PurchaseRoutes } from '../module/purchase/purchase.route.js';
import { subscriptionRoutes } from '../module/subscription/subscription.route.js';

const router = Router();

// ---------------- Authentication Routes ----------------

router.use('/auth', AuthRoutes);

// ---------------- Movies Routes ----------------

router.use('/movies', MovieRoutes);

// ---------------- Reviews Routes ----------------

router.use('/reviews', ReviewRoutes);

// ---------------- Like Routes ----------------

router.use('/likes', likeRoutes);

// ---------------- Comments Routes ----------------

router.use('/comments', commentRoutes);

// ---------------- Watchlisht Routes ----------------

router.use('/watchList', watchlistRoutes);

// ----------------  Purchase Routes ----------------

router.use('/purchase', PurchaseRoutes);

// ----------------  Subscription Routes ----------------

router.use('/subscription', subscriptionRoutes);

export const IndexRoutes = router;

/* router.use("/admin", AdminRoutes);

router.use("/admin-analytics", AdminAnalyticsRoutes);

router.use("/user", UserRoutes); */
