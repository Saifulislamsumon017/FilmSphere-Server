import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route.js';
import { MovieRoutes } from '../module/movies/movies.route.js';
import { ReviewRoutes } from '../module/review/review.route.js';
import { likeRoutes } from '../module/likes/likes.route.js';

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
// router.use('/comments', CommentRoutes);

export const IndexRoutes = router;

/* router.use("/admin", AdminRoutes);


router.use("/watchList", WatchListRoutes);

router.use("/subscription", SubscriptionRoutes);

router.use("/purchase", PurchaseRoutes);

router.use("/admin-analytics", AdminAnalyticsRoutes);

router.use("/user", UserRoutes); */
