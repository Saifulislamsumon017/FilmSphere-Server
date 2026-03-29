import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { AuthValidation } from './auth.validation.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';

const router = Router();

// ✅ Public
router.post(
  '/register',
  validateRequest(AuthValidation.registerUserSchema),
  AuthController.registerUser,
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginUserSchema),
  AuthController.loginUser,
);

router.post(
  '/verify-email',
  validateRequest(AuthValidation.verifyEmailSchema),
  AuthController.verifyEmail,
);

router.post(
  '/forget-password',
  validateRequest(AuthValidation.forgetPasswordSchema),
  AuthController.forgetPassword,
);

router.post(
  '/reset-password',
  validateRequest(AuthValidation.resetPasswordSchema),
  AuthController.resetPassword,
);

// ✅ Protected
router.get(
  '/me',
  checkAuth(UserRole.ADMIN, UserRole.USER),
  AuthController.getMe,
);

router.post(
  '/logout',
  checkAuth(UserRole.ADMIN, UserRole.USER),
  AuthController.logoutUser,
);

export const AuthRoutes = router;
