/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { CookieUtils } from '../utils/cookie.js';
import AppError from '../errorHelpers/AppError.js';
import { prisma } from '../lib/prisma.js';
import { jwtUtils } from '../utils/jwt.js';
import { envVars } from '../config/env.js';

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ===============================
      // GET TOKENS FROM COOKIE
      // ===============================
      const sessionToken = CookieUtils.getCookie(
        req,
        'better-auth.session_token',
      );

      const accessToken = CookieUtils.getCookie(req, 'accessToken');

      // ===============================
      // ACCESS TOKEN REQUIRED
      // ===============================
      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          'Unauthorized access! No access token provided.',
        );
      }

      let sessionUser: {
        userId: string;
        role: UserRole;
        email: string;
      } = {
        userId: '',
        role: UserRole.USER,
        email: '',
      };

      // ===============================
      // SESSION CHECK
      // ===============================
      if (sessionToken) {
        const sessionExists = await prisma.session.findFirst({
          where: {
            token: sessionToken,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        if (sessionExists?.user) {
          const user = sessionExists.user;

          // ===============================
          // USER STATUS CHECK
          // ===============================
          if (
            user.status === UserStatus.BANNED ||
            user.status === UserStatus.DELETED ||
            user.isDeleted
          ) {
            throw new AppError(
              status.UNAUTHORIZED,
              'Unauthorized access! User is not active.',
            );
          }

          sessionUser = {
            userId: user.id,
            role: user.role,
            email: user.email,
          };

          // ===============================
          // SESSION EXPIRING WARNING
          // ===============================
          const now = new Date();
          const expiresAt = new Date(sessionExists.expiresAt);
          const createdAt = new Date(sessionExists.createdAt);

          const totalLife = expiresAt.getTime() - createdAt.getTime();
          const remaining = expiresAt.getTime() - now.getTime();

          const percentRemaining = (remaining / totalLife) * 100;

          if (percentRemaining < 20) {
            res.setHeader('X-Session-Refresh', 'true');
            res.setHeader('X-Session-Expires-At', expiresAt.toISOString());
            res.setHeader('X-Time-Remaining', remaining.toString());

            console.log('Session Expiring Soon!!');
          }
        }
      }

      // ===============================
      // VERIFY ACCESS TOKEN
      // ===============================
      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );

      if (!verifiedToken.success || !verifiedToken.data) {
        throw new AppError(
          status.UNAUTHORIZED,
          'Unauthorized access! Invalid access token.',
        );
      }

      const tokenData = verifiedToken.data;

      // ===============================
      // FINAL USER ASSIGN
      // ===============================
      req.user =
        sessionUser.userId !== ''
          ? sessionUser
          : {
              userId: tokenData.userId,
              role: tokenData.role as UserRole,
              email: tokenData.email,
            };

      // ===============================
      // ROLE CHECK
      // ===============================
      if (authRoles.length > 0 && !authRoles.includes(req.user.role)) {
        throw new AppError(
          status.FORBIDDEN,
          'Forbidden access! You do not have permission to access this resource.',
        );
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
