import { Router } from 'express';

import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';
import { paymentController } from './payment.controller.js';

const router = Router();

/* ================= CHECKOUT ================= */
router.post(
  '/checkout',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  paymentController.createCheckout,
);

/* ================= WEBHOOK ================= */
// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   paymentController.stripeWebhook,
// );

/* ================= REFUND ================= */
router.post(
  '/refund/:id',
  checkAuth(UserRole.ADMIN),
  paymentController.refundPayment,
);

/* ================= MY PURCHASES ================= */
router.get(
  '/me',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  paymentController.myPayment,
);

/* ================= ALL PURCHASES (ADMIN) ================= */
router.get('/all', checkAuth(UserRole.ADMIN), paymentController.getAllPayment);

export const paymentRoutes = router;
