import { Router } from 'express';
import { purchaseController } from './purchase.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';

import { UserRole } from '../../../generated/prisma/enums.js';

const router = Router();

router.post(
  '/',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  purchaseController.createPurchaseCheckout,
);

router.post('/confirm', purchaseController.confirmPurchase);

router.get(
  '/history',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  purchaseController.getPurchaseHistory,
);

router.get(
  '/check/:movieId',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  purchaseController.checkPurchase,
);

router.post(
  '/cancel/:id',
  checkAuth(UserRole.USER),
  purchaseController.cancelPurchases,
);

router.get(
  '/all',
  checkAuth(UserRole.ADMIN),
  purchaseController.getAllPurchases,
);

export const PurchaseRoutes = router;
