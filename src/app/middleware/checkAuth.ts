import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { UserRole } from '../../generated/prisma/enums.js';
import { CookieUtils } from '../utils/cookie.js';
import AppError from '../errorHelpers/AppError.js';
import { prisma } from '../lib/prisma.js';
import { jwtUtils } from '../utils/jwt.js';
import { envVars } from '../config/env.js';

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = CookieUtils.getCookie(req, 'accessToken');

      if (!accessToken) {
        throw new AppError(status.UNAUTHORIZED, 'No access token');
      }

      const verified = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );

      if (!verified.success || !verified.data) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid token');
      }

      const tokenData = verified.data;

      if (!tokenData.userId) {
        throw new AppError(status.UNAUTHORIZED, 'userId missing in token');
      }

      const user = await prisma.user.findUnique({
        where: { id: tokenData.userId },
      });

      if (!user) {
        throw new AppError(status.UNAUTHORIZED, 'User not found');
      }

      req.user = {
        userId: user.id,
        role: user.role,
        email: user.email,
      };

      if (authRoles.length && !authRoles.includes(user.role)) {
        throw new AppError(status.FORBIDDEN, 'Forbidden');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
