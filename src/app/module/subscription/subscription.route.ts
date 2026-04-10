import { Router } from 'express';
import { subscriptionController } from './subscription.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';

const router = Router();

router.post(
  '/',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  subscriptionController.createSubscription,
);

router.post('/confirm', subscriptionController.confirmSubscription);

router.get(
  '/active',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  subscriptionController.getActiveSubscription,
);

router.get(
  '/all',
  checkAuth(UserRole.ADMIN),
  subscriptionController.getAllSubscriptions,
);

router.post(
  '/cancel/:id',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  subscriptionController.cancelSubscription,
);

export const subscriptionRoutes = router;
