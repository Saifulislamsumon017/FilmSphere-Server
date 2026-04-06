export interface ICreateReviewPayload {
  movieId: string;
  rating: number;
  title: string;
  content: string;
  tags?: string[];
  hasSpoiler?: boolean;
}

export interface IUpdateReviewPayload {
  rating?: number;
  title?: string;
  content?: string;
  tags?: string[];
  hasSpoiler?: boolean;
}
