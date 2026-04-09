import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';

import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createReviewValidationSchema,
  updateReviewValidationSchema,
} from './review.validation.js';
import { UserRole } from '../../../generated/prisma/enums.js';

const router = Router();

router.get('/', reviewController.getAllReviews);
router.get('/recent-approved', reviewController.getRecentApprovedReviews);
router.get('/sync-ratings', reviewController.syncRatings);

router.get('/movie/:movieId', reviewController.getReviewsByMovieId);
router.get('/:id', reviewController.getReviewById);

router.post(
  '/',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(createReviewValidationSchema),
  reviewController.createReview,
);

router.put(
  '/:id',
  checkAuth(UserRole.USER),
  // checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(updateReviewValidationSchema),
  reviewController.updateReview,
);

router.delete('/:id', checkAuth(UserRole.USER), reviewController.deleteReview);

router.get(
  '/pending',
  checkAuth(UserRole.ADMIN),
  reviewController.getPendingReviews,
);

router.put(
  '/approve/:id',
  checkAuth(UserRole.ADMIN),
  reviewController.approveReview,
);

router.put(
  '/reject/:id',
  checkAuth(UserRole.ADMIN),
  reviewController.rejectReview,
);

export const ReviewRoutes = router;
