import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { tokenUtils } from '../../utils/token.js';
import { CookieUtils } from '../../utils/cookie.js';
import AppError from '../../errorHelpers/AppError.js';
import { AuthService } from './auth.service.js';
import { AuthValidation } from './auth.validation.js';
import { envVars } from '../../config/env.js';
import { auth } from '../../lib/auth.js';

// ---------------- Register ----------------

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  // console.log(payload);

  const result = await AuthService.registerUser(payload);

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    httpStatusCode: StatusCodes.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

// ---------------- login ----------------

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.loginUser(payload);

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

// ---------------- Verify Email ----------------
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.verifyEmail(payload);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'Email verified successfully',
    data: result,
  });
});

// ---------------- Get Me ----------------
const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  // console.log({ user });

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const result = await AuthService.getMe(user);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'User profile fetched successfully',
    data: result,
  });
});

// ---------------- Refresh Token ----------------

const getNewToken = catchAsync(async (req: Request, res: Response) => {
  // ✅ Parse cookies using Zod
  const parsed = AuthValidation.refreshTokenSchema.safeParse({
    refreshToken: req.cookies.refreshToken,
    sessionToken: req.cookies['better-auth.session_token'],
  });

  if (!parsed.success) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      parsed.error.issues[0].message,
    );
  }

  const result = await AuthService.getNewToken(parsed.data);

  // ✅ Set cookies
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);

  // ✅ Send response
  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'New tokens generated successfully',
    data: result,
  });
});

// ---------------- Logout ----------------

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = req.cookies['better-auth.session_token'];

  const result = await AuthService.logoutUser(sessionToken);

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
    data: result,
  });
});

// ===================== CHANGE PASSWORD =====================

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const betterAuthSessionToken = req.cookies['better-auth.session_token'];

  const result = await AuthService.changePassword(
    payload,
    betterAuthSessionToken,
  );

  const { accessToken, refreshToken, token } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

// ---------------- Forget Password ----------------
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.forgetPassword(email);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset OTP sent to email successfully',
    data: result,
  });
});

// ---------------- Reset Password ----------------
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const result = await AuthService.resetPassword(email, otp, newPassword);

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successfully',
    data: result,
  });
});

// ---------------- Start Google Login (redirect user to OAuth) ----------------

const googleLogin = catchAsync((req: Request, res: Response) => {
  const redirectPath = req.query.redirect || '/dashboard';

  const encodedRedirectPath = encodeURIComponent(redirectPath as string);

  const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

  res.render('googleRedirect', {
    callbackURL: callbackURL,
    betterAuthUrl: envVars.BETTER_AUTH_URL,
  });
});

// ---------------- Google Login Success callback ----------------

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || '/dashboard';
  const sessionToken = req.cookies['better-auth.session_token'];

  if (!sessionToken) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
  }

  const session = await auth.api.getSession({
    headers: { Cookie: `better-auth.session_token=${sessionToken}` },
  });

  if (!session || !session.user) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_user_found`);
  }

  const { accessToken, refreshToken } =
    await AuthService.googleLoginSuccess(session);

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);

  const isValidRedirect =
    redirectPath.startsWith('/') && !redirectPath.startsWith('//');
  const finalRedirect = isValidRedirect ? redirectPath : '/dashboard';

  res.redirect(`${envVars.FRONTEND_URL}${finalRedirect}`);
});

// ---------------- Google OAuth Error Handler----------------

const handleOAuthError = catchAsync((req: Request, res: Response) => {
  const error = (req.query.error as string) || 'oauth_failed';
  res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
});

// ---------------- Export ----------------
export const AuthController = {
  registerUser,
  loginUser,
  verifyEmail,
  getMe,
  getNewToken,
  logoutUser,
  changePassword,
  forgetPassword,
  resetPassword,
  googleLogin,
  googleLoginSuccess,
  handleOAuthError,
};
