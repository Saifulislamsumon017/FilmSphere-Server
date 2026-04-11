import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.js';
import { StatsController } from './stats.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';

const router = Router();

router.get(
  '/dashboard',
  checkAuth(UserRole.ADMIN, UserRole.USER),
  StatsController.getDashboardStatsData,
);

router.get('/chart', checkAuth(UserRole.ADMIN), StatsController.getChartData);

router.get(
  '/activity-logs',
  checkAuth(UserRole.ADMIN),
  StatsController.getActivityLogs,
);

router.get(
  '/pending-reviews',
  checkAuth(UserRole.ADMIN),
  StatsController.getPendingReviews,
);

router.patch(
  '/review/approve/:id',
  checkAuth(UserRole.ADMIN),
  StatsController.approveReview,
);

router.patch(
  '/review/reject/:id',
  checkAuth(UserRole.ADMIN),
  StatsController.rejectReview,
);

export const StatsRoutes = router;
