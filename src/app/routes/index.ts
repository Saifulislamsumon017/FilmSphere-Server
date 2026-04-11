import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route.js';
import { MovieRoutes } from '../module/movies/movies.route.js';
import { ReviewRoutes } from '../module/review/review.route.js';
import { likeRoutes } from '../module/likes/likes.route.js';
import { commentRoutes } from '../module/comments/comment.route.js';
import { watchlistRoutes } from '../module/watchlist/watchlist.route.js';
import { PurchaseRoutes } from '../module/purchase/purchase.route.js';
import { subscriptionRoutes } from '../module/subscription/subscription.route.js';
import { paymentRoutes } from '../module/payment/payment.route.js';
import { webhookSubscriptionRoutes } from '../module/webhookSubscription/webhooksubscription.route.js';
import { userRoutes } from '../module/user/user.route.js';
import { AdminRoutes } from '../module/admin/admin.route.js';
import { StatsRoutes } from '../module/stats/stats.route.js';

const router = Router();
router.use('/auth', AuthRoutes);
router.use('/user', userRoutes);
router.use('/admin', AdminRoutes);
router.use('/stats', StatsRoutes);
router.use('/movies', MovieRoutes);
router.use('/reviews', ReviewRoutes);
router.use('/likes', likeRoutes);
router.use('/comments', commentRoutes);
router.use('/watchList', watchlistRoutes);

router.use('/purchase', PurchaseRoutes);
router.use('/payments', paymentRoutes);

router.use('/subscription', subscriptionRoutes);
router.use('/webhook-subscription', webhookSubscriptionRoutes);

export const IndexRoutes = router;

/*
router.use("/admin-analytics", AdminAnalyticsRoutes);

 */
