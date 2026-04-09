import { Router } from 'express';
import { likeController } from './likes.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';

const router = Router();

/* ================= GET ALL LIKES ================= */
router.get('/', likeController.getAllLikes);

/* ================= LIKE A REVIEW ================= */
router.post(
  '/:reviewId/like',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  likeController.likeReview,
);

/* ================= UNLIKE A REVIEW ================= */
router.delete(
  '/:reviewId/unlike',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  likeController.unlikeReview,
);

/* ================= CHECK IF LIKED ================= */
router.get(
  '/check/:reviewId',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  likeController.isLiked,
);

/* ================= TOGGLE LIKE ================= */
router.post(
  '/:reviewId/toggle-like',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  likeController.toggleLike,
);

export const likeRoutes = router;
