import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { movieService } from './movies.service.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

const createMovie = catchAsync(async (req: Request, res: Response) => {
  const result = await movieService.createMovie(req.body, req.file);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Movie created',
    data: result,
  });
});

const getAllMovies = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await movieService.getAllMovies(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Movies fetched',
    data: result.data,
    meta: result.meta,
  });
});

const getMovieById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await movieService.getMovieById(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Movie fetched',
    data: result,
  });
});

const updateMovie = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const result = await movieService.updateMovie(
    id as string,
    payload,
    req.file,
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Movie updated',
    data: result,
  });
});

const deleteMovie = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await movieService.deleteMovie(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Movie deleted',
    data: result,
  });
});

const getFeaturedMovies = catchAsync(async (req: Request, res: Response) => {
  const result = await movieService.getFeaturedMovies();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Featured movies',
    data: result,
  });
});

const getNewReleases = catchAsync(async (req: Request, res: Response) => {
  const result = await movieService.getNewReleases();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'New releases',
    data: result,
  });
});

const getComingSoon = catchAsync(async (req: Request, res: Response) => {
  const result = await movieService.getComingSoon();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Coming soon',
    data: result,
  });
});

const getEditorsPicks = catchAsync(async (req: Request, res: Response) => {
  const result = await movieService.getEditorsPicks();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Editors picks',
    data: result,
  });
});

export const movieController = {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  getFeaturedMovies,
  getNewReleases,
  getComingSoon,
  getEditorsPicks,
};
