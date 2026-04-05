import { z } from 'zod';

export const createMovieValidationSchema = z.object({
  title: z.string().min(1),
  synopsis: z.string().min(10),

  genre: z.array(z.string()).min(1),
  language: z.array(z.string()).min(1),

  releaseYear: z.coerce.number(),

  director: z.string(),
  cast: z.array(z.string()).min(1),

  streamingPlatform: z.array(z.string()).min(1),

  type: z.enum(['MOVIE', 'SERIES']),

  seasons: z.coerce.number().optional(),
  episodes: z.coerce.number().optional(),
  runtime: z.coerce.number().optional(),

  streamingLink: z.string().optional(),

  pricing: z.enum(['FREE', 'PREMIUM']),
  buyPrice: z.coerce.number().optional(),
  rentPrice: z.coerce.number().optional(),
});

export const updateMovieValidationSchema =
  createMovieValidationSchema.partial();
