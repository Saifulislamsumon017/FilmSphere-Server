/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import z from 'zod';
import jwt from 'jsonwebtoken';

import { envVars } from '../config/env.js';
import { deleteUploadedFilesFromGlobalErrorHandler } from '../utils/deleteUploadedFilesFromGlobalErrorHandler.js';

import {
  TErrorResponse,
  TErrorSources,
} from '../interfaces/error.interface.js';

import { handleZodError } from '../errorHelpers/handleZodError.js';
import AppError from '../errorHelpers/AppError.js';

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envVars.NODE_ENV === 'development') {
    console.log('🔥 Error from Global Error Handler:', err);
  }

  await deleteUploadedFilesFromGlobalErrorHandler(req);

  let errorSources: TErrorSources[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let stack: string | undefined = undefined;

  // ✅ ZOD ERROR
  if (err instanceof z.ZodError) {
    const simplifiedError = handleZodError(err);

    statusCode = simplifiedError.statusCode || status.BAD_REQUEST;
    message = simplifiedError.message || 'Validation Error';
    errorSources = simplifiedError.errorSources || [];
    stack = err.stack;
  }

  // ✅ CUSTOM APP ERROR
  else if (err instanceof AppError) {
    statusCode = err.statusCode || status.BAD_REQUEST;
    message = err.message;
    stack = err.stack;

    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  }

  // ✅ JWT TOKEN EXPIRED
  else if (err instanceof jwt.TokenExpiredError) {
    statusCode = status.UNAUTHORIZED;
    message = 'Token expired';
    stack = err.stack;

    errorSources = [
      {
        path: '',
        message,
      },
    ];
  }

  // ✅ JWT INVALID TOKEN
  else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = status.UNAUTHORIZED;
    message = 'Invalid token';
    stack = err.stack;

    errorSources = [
      {
        path: '',
        message,
      },
    ];
  }

  // ✅ PRISMA UNIQUE ERROR
  else if (err?.code === 'P2002') {
    statusCode = status.CONFLICT;
    message = 'Duplicate field value';

    errorSources = [
      {
        path: err?.meta?.target?.[0] || '',
        message: `${err?.meta?.target?.[0] || 'Field'} already exists`,
      },
    ];
  }

  // ✅ PRISMA RECORD NOT FOUND
  else if (err?.code === 'P2025') {
    statusCode = status.NOT_FOUND;
    message = 'Requested resource not found';

    errorSources = [
      {
        path: '',
        message,
      },
    ];
  }

  // ✅ BETTER AUTH / API ERROR
  else if (err?.body?.code || err?.body?.message) {
    statusCode = err.statusCode || status.BAD_REQUEST;
    message = err.body.message || 'Request Failed';
    stack = err.stack;

    errorSources = [
      {
        path: '',
        message,
      },
    ];
  }

  // ✅ MULTER ERROR
  else if (err?.name === 'MulterError') {
    statusCode = status.BAD_REQUEST;
    message = err.message || 'File upload error';

    errorSources = [
      {
        path: '',
        message,
      },
    ];
  }

  // ✅ NORMAL ERROR
  else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = err.message || 'Something went wrong';
    stack = err.stack;

    errorSources = [
      {
        path: '',
        message,
      },
    ];
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message,
    errorSources,
    error: envVars.NODE_ENV === 'development' ? err : undefined,
    stack: envVars.NODE_ENV === 'development' ? stack : undefined,
  };

  res.status(statusCode).json(errorResponse);
};
