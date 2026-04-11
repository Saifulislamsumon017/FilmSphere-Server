import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';
import { subscriptionController } from './webhooksubscription.controller.js';

const router = Router();

router.post(
  '/checkout',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  subscriptionController.createCheckoutSubscription,
);

router.get(
  '/me',
  checkAuth(UserRole.USER),
  subscriptionController.mySubscription,
);

router.get(
  '/all',
  checkAuth(UserRole.ADMIN),
  subscriptionController.getAllSubscription,
);

router.post(
  '/cancel/:id',
  checkAuth(UserRole.USER),
  subscriptionController.cancelSubscription,
);

export const webhookSubscriptionRoutes = router;
