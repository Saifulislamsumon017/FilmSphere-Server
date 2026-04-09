import { z } from 'zod';

export const createPurchaseValidationSchema = z.object({
  movieId: z.string(),
  purchaseType: z.enum(['BUY', 'RENT']),
});

export const confirmPurchaseValidationSchema = z.object({
  sessionId: z.string(),
});
