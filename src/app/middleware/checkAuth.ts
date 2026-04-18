/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { CookieUtils } from '../utils/cookie.js';
import { prisma } from '../lib/prisma.js';
import AppError from '../errorHelpers/AppError.js';
import { jwtUtils } from '../utils/jwt.js';
import { envVars } from '../config/env.js';

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken = CookieUtils.getCookie(
        req,
        'better-auth.session_token',
      );

      const accessToken = CookieUtils.getCookie(req, 'accessToken');

      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          'Unauthorized access! No access token provided.',
        );
      }

      let userData = null;

      // ===============================
      // SESSION CHECK (optional)
      // ===============================
      if (sessionToken) {
        const sessionExists = await prisma.session.findFirst({
          where: {
            token: sessionToken,
            expiresAt: { gt: new Date() },
          },
          include: { user: true },
        });

        if (sessionExists?.user) {
          const user = sessionExists.user;

          // user status check
          if (
            user.status === UserStatus.SUSPENDED ||
            user.status === UserStatus.DELETED ||
            user.isDeleted
          ) {
            throw new AppError(status.UNAUTHORIZED, 'User is not active.');
          }

          userData = {
            userId: user.id,
            role: user.role,
            email: user.email,
          };

          // session expiry warning
          const now = new Date();
          const expiresAt = new Date(sessionExists.expiresAt);
          const createdAt = new Date(sessionExists.createdAt);

          const total = expiresAt.getTime() - createdAt.getTime();
          const remaining = expiresAt.getTime() - now.getTime();

          if ((remaining / total) * 100 < 20) {
            res.setHeader('X-Session-Refresh', 'true');
          }
        }
      }

      // ===============================
      // JWT CHECK (mandatory)
      // ===============================
      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );

      if (!verifiedToken.success) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid access token.');
      }

      const tokenData = verifiedToken.data!;

      // 🔥 ALWAYS ensure req.user
      req.user = userData || {
        userId: tokenData.userId,
        role: tokenData.role,
        email: tokenData.email,
      };

      // ===============================
      // ROLE CHECK
      // ===============================
      if (authRoles.length > 0 && !authRoles.includes(req.user.role)) {
        throw new AppError(status.FORBIDDEN, 'Forbidden access!');
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
