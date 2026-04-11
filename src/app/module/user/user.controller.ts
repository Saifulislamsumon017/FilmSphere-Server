import { Request, Response } from 'express';
import status from 'http-status';

import { userService } from './user.service.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

/* ================= USER DASHBOARD ================= */

const getUserDashboard = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await userService.getUserDashboard(user);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Dashboard fetched successfully',
    data: result,
  });
});

/* ================= USER ANALYTICS ================= */

const getUserAnalytics = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await userService.getUserAnalytics(user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: 'Analytics fetched',
    data: result,
  });
});

/* ================= USER STATS ================= */

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserStats(req.user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User stats fetched successfully',
    data: result,
  });
});

/* ================= PROFILE ================= */

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserProfile(req.user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Profile fetched successfully',
    data: result,
  });
});

/* ================= UPDATE PROFILE ================= */

const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const payload = {
    ...req.body,
    image: req.file?.path, // ✅ multer-storage-cloudinary use করলে এটা URL হয়
  };

  const result = await userService.updateUserProfile(user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

/* ================= GET ALL USERS ================= */

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await userService.getAllUsers(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Users fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const userController = {
  getUserDashboard,
  getUserAnalytics,
  getUserStats,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
};
