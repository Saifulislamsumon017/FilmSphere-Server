import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from './auth.service.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { tokenUtils } from '../../utils/token.js';
import { CookieUtils } from '../../utils/cookie.js';

// ---------------- Register ----------------
const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.authRegister(req.body);

  // ✅ Set cookies
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.token) {
    tokenUtils.setBetterAuthSessionCookie(res, result.token);
  }

  sendResponse(res, {
    httpStatusCode: StatusCodes.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

// ---------------- Login ----------------
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.authLogin(req.body);

  // ✅ Set cookies
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.token) {
    tokenUtils.setBetterAuthSessionCookie(res, result.token);
  }

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

// ---------------- Verify Email ----------------
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyEmail(req.body);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'Email verified successfully',
    data: result,
  });
});

// ---------------- Get Me ----------------
const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.authMe(req.user);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'User profile fetched successfully',
    data: result,
  });
});

// ---------------- Logout ----------------
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = req.cookies['better-auth.session_token'];

  await authService.logOut(sessionToken);

  // ✅ Clear all cookies
  CookieUtils.clearCookie(res, 'accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  CookieUtils.clearCookie(res, 'refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  CookieUtils.clearCookie(res, 'better-auth.session_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'User logged out successfully',
  });
});

// ---------------- Forget Password ----------------
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent successfully',
  });
});

// ---------------- Reset Password ----------------
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successful',
  });
});

// ---------------- Export ----------------
export const AuthController = {
  registerUser,
  loginUser,
  verifyEmail,
  getMe,
  logoutUser,
  forgetPassword,
  resetPassword,
};
