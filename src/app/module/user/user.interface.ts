export interface IUserUpdatePayload {
  name?: string;
  email?: string;
  image?: string;
}

// export interface IUserUpdatePayload {
//   name?: string;
//   email?: string;
// }

export interface IUserStatsResponse {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  purchases: {
    total: number;
    totalSpent: number;
  };
  topGenres: {
    genre: string;
    count: number;
  }[];
}
