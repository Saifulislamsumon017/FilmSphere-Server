/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ILoginUserPayload,
  IRegisterUserPayload,
  IVerifyEmailPayload,
  IResetPasswordPayload,
  IGetNewTokenPayload,
  IGoogleSession,
  IGoogleLoginResponse,
} from './auth.interface.js';
import { auth } from '../../lib/auth.js';
import AppError from '../../errorHelpers/AppError.js';
import status from 'http-status';
import { prisma } from '../../lib/prisma.js';
import { tokenUtils } from '../../utils/token.js';
import { UserRole, UserStatus } from '../../../generated/prisma/enums.js';
import { envVars } from '../../config/env.js';
import { JwtPayload } from 'jsonwebtoken';
import { jwtUtils } from '../../utils/jwt.js';

// ✅ Register
const registerUser = async (payload: IRegisterUserPayload) => {
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
const loginUser = async (payload: ILoginUserPayload) => {
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
  const { email, otp } = payload;

  // OTP check in Verification table
  const token = await prisma.verification.findFirst({
    where: {
      identifier: email,
      value: otp,
      expiresAt: { gt: new Date() }, // still valid
    },
  });

  if (!token) {
    throw new AppError(status.BAD_REQUEST, 'Invalid or expired OTP');
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  // Remove used OTP
  await prisma.verification.delete({ where: { id: token.id } });

  return { message: 'Email verified successfully' };
};

// ✅ Get Me
const getMe = async (user: any) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!userData) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  return userData;
};

// ---------------- Refresh Token ----------------

const getNewToken = async (payload: IGetNewTokenPayload) => {
  const { refreshToken, sessionToken } = payload;

  const isSessionTokenExists = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!isSessionTokenExists) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid session token');
  }

  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );

  if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid refresh token');
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  // ✅ extra security (recommended)
  if (data.userId !== isSessionTokenExists.userId) {
    throw new AppError(status.UNAUTHORIZED, 'Token mismatch');
  }

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const { token } = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  };
};

// ✅ Logout
const logoutUser = async (sessionToken: string) => {
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

// ---------------- Google Login Success ----------------
const googleLoginSuccess = async (
  session: IGoogleSession,
): Promise<IGoogleLoginResponse> => {
  const userId = session.user.id;

  let user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: session.user.name,
        email: session.user.email,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });
  }

  const payload = {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
  };

  const accessToken = tokenUtils.getAccessToken(payload);
  const refreshToken = tokenUtils.getRefreshToken(payload);

  return { accessToken, refreshToken };
};

export const AuthService = {
  registerUser,
  loginUser,
  verifyEmail,
  getMe,
  getNewToken,
  logoutUser,
  googleLoginSuccess,
  forgotPassword,
  resetPassword,
};
