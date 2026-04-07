import { Router } from 'express';
import { commentController } from './comment.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { UserRole } from '../../../generated/prisma/enums.js';
import {
  createCommentValidationSchema,
  updateCommentValidationSchema,
} from './comment.validation.js';

const router = Router();

router.get('/', commentController.getAllComments);

router.get('/review/:reviewId', commentController.getCommentsByReview);

router.get('/:id', commentController.getCommentById);

router.post(
  '/',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(createCommentValidationSchema),
  commentController.createComment,
);

router.put(
  '/:id',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  validateRequest(updateCommentValidationSchema),
  commentController.updateComment,
);

router.delete(
  '/:id',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  commentController.deleteComment,
);

export const commentRoutes = router;
