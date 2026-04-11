import { Router } from 'express';

import { userController } from './user.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';
import { multerUpload } from '../../config/multer.config.js';

const router = Router();

/* ================= USER DASHBOARD ================= */

router.get(
  '/dashboard',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  userController.getUserDashboard,
);

router.get(
  '/dashboard/analytics',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  userController.getUserAnalytics,
);

router.get(
  '/stats',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  userController.getUserStats,
);

router.get(
  '/profile',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  userController.getUserProfile,
);

router.patch(
  '/update-profile',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  multerUpload.single('file'),
  userController.updateUserProfile,
);

router.get('/all', checkAuth(UserRole.ADMIN), userController.getAllUsers);

export const userRoutes = router;
