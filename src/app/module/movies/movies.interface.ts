import { ContentType, PricingType } from '../../../generated/prisma/enums.js';

export interface ICreateMovie {
  title: string;
  synopsis: string;
  thumbnail?: string;
  genre: string[];
  language: string[];
  releaseYear: number;
  director: string;
  cast: string[];
  streamingPlatform: string[];

  type: ContentType;

  seasons?: number;
  episodes?: number;
  runtime?: number;

  streamingLink?: string;

  pricing: PricingType;
  buyPrice?: number;
  rentPrice?: number;
}

export interface IUpdateMovie {
  title?: string;
  synopsis?: string;
  thumbnail?: string;
  genre?: string[];
  language?: string[];
  releaseYear?: number;
  director?: string;
  cast?: string[];
  streamingPlatform?: string[];

  type?: ContentType;

  seasons?: number;
  episodes?: number;
  runtime?: number;

  streamingLink?: string;

  pricing?: PricingType;
  buyPrice?: number;
  rentPrice?: number;
}
