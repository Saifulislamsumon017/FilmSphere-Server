/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ILoginUserPayload,
  IRegisterUserPayload,
  IVerifyEmailPayload,
  IResetPasswordPayload,
} from './auth.interface.js';
import { auth } from '../../lib/auth.js';
import AppError from '../../errorHelpers/AppError.js';
import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import { tokenUtils } from '../../utils/token.js';
import { UserStatus } from '../../../generated/prisma/enums.js';

// ✅ Register
const authRegister = async (payload: IRegisterUserPayload) => {
  const data = await auth.api.signUpEmail({
    body: payload,
  });

  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, 'User registration failed');
  }

  const accessToken = tokenUtils.getAccessToken(data.user);
  const refreshToken = tokenUtils.getRefreshToken(data.user);

  return { ...data, accessToken, refreshToken };
};

// ✅ Login
const authLogin = async (payload: ILoginUserPayload) => {
  const data = await auth.api.signInEmail({
    body: payload,
  });

  if (data.user.status !== UserStatus.ACTIVE) {
    throw new AppError(status.UNAUTHORIZED, 'User not active');
  }

  const accessToken = tokenUtils.getAccessToken(data.user);
  const refreshToken = tokenUtils.getRefreshToken(data.user);

  return { ...data, accessToken, refreshToken };
};

// ✅ Verify Email
const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const result = await auth.api.verifyEmailOTP({
    body: payload,
  });

  if (!result) {
    throw new AppError(status.BAD_REQUEST, 'Invalid or expired OTP');
  }

  return result;
};

// ✅ Get Me
const authMe = async (user: any) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!userData) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  return userData;
};

// ✅ Logout
const logOut = async (sessionToken: string) => {
  return await auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });
};

// ✅ Forgot Password
const forgotPassword = async (email: string) => {
  await auth.api.requestPasswordResetEmailOTP({
    body: { email },
  });
};

// ✅ Reset Password
const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password: newPassword,
    },
  });
};

export const authService = {
  authRegister,
  authLogin,
  verifyEmail,
  authMe,
  logOut,
  forgotPassword,
  resetPassword,
};
