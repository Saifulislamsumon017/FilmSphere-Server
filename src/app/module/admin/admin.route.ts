import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { AdminController } from './admin.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  changeUserRoleSchema,
  changeUserStatusSchema,
  updateAdminZodSchema,
} from './admin.validation.js';

const router = Router();

router.get('/', checkAuth(UserRole.ADMIN), AdminController.getAllAdmins);

router.get('/:id', checkAuth(UserRole.ADMIN), AdminController.getAdminById);

router.patch(
  '/:id',
  checkAuth(UserRole.ADMIN),
  validateRequest(updateAdminZodSchema),
  AdminController.updateAdmin,
);

router.delete('/:id', checkAuth(UserRole.ADMIN), AdminController.deleteAdmin);

router.patch(
  '/change-user-status',
  checkAuth(UserRole.ADMIN),
  validateRequest(changeUserStatusSchema),
  AdminController.changeUserStatus,
);

router.patch(
  '/change-user-role',
  checkAuth(UserRole.ADMIN),
  validateRequest(changeUserRoleSchema),
  AdminController.changeUserRole,
);

export const AdminRoutes = router;
