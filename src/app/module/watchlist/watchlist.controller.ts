import { Request, Response } from 'express';
import status from 'http-status';
import { watchlistService } from './watchlist.service.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= ADD ================= */

const addToWatchlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { movieId } = req.params;

  const result = await watchlistService.addToWatchlist(user, movieId as string);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Added to watchlist successfully',
    data: result,
  });
});

/* ================= REMOVE ================= */

const removeFromWatchlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { movieId } = req.params;

  const result = await watchlistService.removeFromWatchlist(
    user,
    movieId as string,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Removed from watchlist successfully',
    data: result,
  });
});

/* ================= GET ================= */

const getWatchlist = catchAsync(async (req: Request, res: Response) => {
  const { query } = req.query;

  const result = await watchlistService.getWatchlist(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Watchlist fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

/* ================= CHECK ================= */

const isInWatchlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { movieId } = req.params;

  const result = await watchlistService.isInWatchlist(user, movieId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Watchlist status',
    data: result,
  });
});

export const watchlistController = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist,
};
