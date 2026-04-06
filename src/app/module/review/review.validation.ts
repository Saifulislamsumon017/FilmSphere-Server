import { z } from 'zod';

export const createReviewValidationSchema = z.object({
  movieId: z.string(),

  rating: z.number().min(1).max(10),

  title: z.string().min(5).max(100),

  content: z.string().min(20),

  tags: z.array(z.string()).optional(),

  hasSpoiler: z.boolean().optional(),
});

export const updateReviewValidationSchema = z.object({
  rating: z.number().min(1).max(10).optional(),

  title: z.string().min(5).max(100).optional(),

  content: z.string().min(20).optional(),

  tags: z.array(z.string()).optional(),

  hasSpoiler: z.boolean().optional(),
});
