import { z } from 'zod';

/* ================= PARAM ================= */

export const likeValidationSchema = z.object({
  reviewId: z
    .string('Review ID is required')
    .min(1, 'Review ID cannot be empty'),
});
