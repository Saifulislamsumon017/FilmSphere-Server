import z from 'zod';

const registerUserSchema = z.object({
  name: z.string('Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string('Password is required'),
});

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const forgetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// ✅ Refresh Token Schema (for controller use)
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  sessionToken: z.string().min(1, 'Session token is required'),
});

export const AuthValidation = {
  registerUserSchema,
  loginUserSchema,
  verifyEmailSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
};
