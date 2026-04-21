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
import { IRequestUser } from '../../interfaces/requestUser.interface.js';
// import bcrypt from 'bcrypt';

// =========================
// REGISTER USER
// =========================
export const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  const user = data?.user;

  if (!user) {
    throw new AppError(status.BAD_REQUEST, 'User registration failed');
  }

  const jwtPayload = {
    userId: user.id,
    role: user.role as UserRole,
    name: user.name,
    email: user.email,
    status: user.status as UserStatus,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
  };

  const accessToken = tokenUtils.getAccessToken(jwtPayload);
  const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

// =========================
// LOGIN USER
// =========================
export const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const data = await auth.api.signInEmail({
    body: { email, password },
  });

  const user = data?.user;

  // 🔴 safety check
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid credentials');
  }

  // 🚫 BLOCKED
  if (user.status === UserStatus.BANNED) {
    throw new AppError(status.FORBIDDEN, 'User is banned');
  }

  // 🚫 DELETED
  if (user.status === UserStatus.DELETED || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, 'User is deleted');
  }

  // 🚫 NOT ACTIVE
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(status.UNAUTHORIZED, 'User not active');
  }

  const jwtPayload = {
    userId: user.id,
    role: user.role as UserRole,
    name: user.name,
    email: user.email,
    status: user.status as UserStatus,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
  };

  const accessToken = tokenUtils.getAccessToken(jwtPayload);
  const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

// ✅ Verify Email

const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const email = payload.email.trim().toLowerCase();
  const otp = String(payload.otp).trim();

  console.log('EMAIL:', email);
  console.log('OTP:', otp);

  const token = await prisma.verification.findFirst({
    where: {
      identifier: email,
      value: otp,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('TOKEN:', token);

  if (!token) {
    throw new AppError(status.BAD_REQUEST, 'Invalid OTP');
  }

  if (token.expiresAt < new Date()) {
    throw new AppError(status.BAD_REQUEST, 'OTP expired');
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
    },
  });

  await prisma.verification.delete({
    where: { id: token.id },
  });

  return { message: 'Email verified successfully' };
};

// ✅ Get Me
const getMe = async (user: IRequestUser) => {
  const userId = user?.userId;

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, 'Unauthorized user');
  }

  const isUserExists = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  return isUserExists;
};

// ---------------- Refresh Token ----------------

const getNewToken = async (payload: IGetNewTokenPayload) => {
  const { refreshToken, sessionToken } = payload;

  // =========================
  // CHECK SESSION
  // =========================
  const session = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid session token');
  }

  // =========================
  // VERIFY REFRESH TOKEN
  // =========================
  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid refresh token');
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  // =========================
  // SECURITY CHECK
  // =========================
  if (!data.userId) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid token payload');
  }

  if (data.userId !== session.userId) {
    throw new AppError(status.UNAUTHORIZED, 'Token mismatch');
  }

  const jwtPayload = {
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status as UserStatus,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  };

  // =========================
  // CREATE NEW TOKENS
  // =========================

  const newAccessToken = tokenUtils.getAccessToken(jwtPayload);
  const newRefreshToken = tokenUtils.getRefreshToken(jwtPayload);

  // =========================
  // UPDATE SESSION
  // =========================
  const updatedSession = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // =========================
  // RETURN RESULT
  // =========================
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: updatedSession.token,
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

// ===================== FORGET PASSWORD =====================
const forgotPassword = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  if (!user.emailVerified) {
    throw new AppError(status.BAD_REQUEST, 'Email not verified');
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  // ✅ trigger OTP
  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email: normalizedEmail,
    },
  });
};
// ===================== RESET PASSWORD =====================

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  const normalizedEmail = email.trim().toLowerCase();

  // 1️⃣ OTP verify
  const record = await prisma.verification.findFirst({
    where: {
      identifier: normalizedEmail,
      value: otp,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new Error('Invalid or expired OTP');
  }

  // 2️⃣ user check
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 3️⃣ 🔥 IMPORTANT: USE BETTER AUTH RESET API
  await auth.api.resetPassword({
    body: {
      token: record.value,
      newPassword,
    },
  });

  // 4️⃣ cleanup OTP
  await prisma.verification.deleteMany({
    where: { identifier: normalizedEmail },
  });

  return true;
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
