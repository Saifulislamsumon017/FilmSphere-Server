export interface ICreateCommentPayload {
  reviewId: string;
  content: string;
  parentCommentId?: string;
}

export interface IUpdateCommentPayload {
  content: string;
}
