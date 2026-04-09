import { z } from 'zod';

export const createCommentValidationSchema = z.object({
  reviewId: z.string('Review ID is required'),

  content: z.string('Content is required').min(1).max(500),

  parentCommentId: z.string().optional(),
});

export const updateCommentValidationSchema = z.object({
  content: z.string('Content is required').min(1).max(500),
});
