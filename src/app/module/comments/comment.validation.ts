import { z } from 'zod';

export const createCommentValidationSchema = z.object({
  body: z.object({
    reviewId: z.string('Review ID is required'),

    content: z
      .string('Content is required')
      .min(1, 'Content is required')
      .max(500, 'Content max 500 characters'),

    parentCommentId: z.string().optional(),
  }),
});

export const updateCommentValidationSchema = z.object({
  body: z.object({
    content: z
      .string('Content is required')
      .min(1, 'Content is required')
      .max(500, 'Content max 500 characters'),
  }),
});
