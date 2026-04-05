import { Prisma } from '../../../generated/prisma/client.js';

export const movieSearchableFields = ['title', 'director', 'genre', 'language'];

export const movieFilterableFields = ['type', 'pricing', 'releaseYear'];

export const movieIncludeConfig: Partial<
  Record<
    keyof Prisma.MovieInclude,
    Prisma.MovieInclude[keyof Prisma.MovieInclude]
  >
> = {
  reviews: true,
};
