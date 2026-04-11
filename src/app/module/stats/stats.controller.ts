import { Request, Response } from 'express';
import status from 'http-status';
import { StatsService } from './stats.service.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

const getDashboardStatsData = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await StatsService.getDashboardStatsData(user);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: result,
    });
  },
);

const getChartData = catchAsync(async (req: Request, res: Response) => {
  const result = await StatsService.getChartData();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Chart data fetched successfully',
    data: result,
  });
});

const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await StatsService.getActivityLogs(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Activity logs fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await StatsService.getPendingReviews(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Pending reviews fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const approveReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StatsService.approveReview(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review approved successfully',
    data: result,
  });
});

const rejectReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await StatsService.rejectReview(id as string, req.body.reason);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Review rejected successfully',
    data: result,
  });
});

export const StatsController = {
  getDashboardStatsData,
  getChartData,
  getActivityLogs,
  getPendingReviews,
  approveReview,
  rejectReview,
};
