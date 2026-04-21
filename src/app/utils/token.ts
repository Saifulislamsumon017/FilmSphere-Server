import { Response } from 'express';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { jwtUtils } from './jwt.js';
import { envVars } from '../config/env.js';
import { CookieUtils } from './cookie.js';

const getAccessToken = (payload: JwtPayload) => {
  return jwtUtils.createToken(payload, envVars.ACCESS_TOKEN_SECRET, {
    expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

const getRefreshToken = (payload: JwtPayload) => {
  return jwtUtils.createToken(payload, envVars.REFRESH_TOKEN_SECRET, {
    expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

const setAccessTokenCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, 'accessToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, 'refreshToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, 'better-auth.session_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
};
