/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const createToken = (
  payload: JwtPayload,
  secret: string,
  { expiresIn }: SignOptions,
) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token: string, secret: string) => {
  try {
    return {
      success: true,
      data: jwt.verify(token, secret) as JwtPayload,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};
