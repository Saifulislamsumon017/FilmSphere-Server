import { Router } from 'express';
import { likeController } from './likes.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { UserRole } from '../../../generated/prisma/enums.js';
import { likeValidationSchema } from './likes.validation.js';

const router = Router();

router.get('/', likeController.getAllLikes);

router.post(
  '/:reviewId/like',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(likeValidationSchema),
  likeController.likeReview,
);

router.delete(
  '/:reviewId/unlike',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(likeValidationSchema),
  likeController.unlikeReview,
);

router.get(
  '/check/:reviewId',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(likeValidationSchema),
  likeController.isLiked,
);

router.post(
  '/:reviewId/toggle-like',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(likeValidationSchema),
  likeController.toggleLike,
);

export const likeRoutes = router;
