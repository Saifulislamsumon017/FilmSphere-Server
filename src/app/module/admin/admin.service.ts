import { prisma } from '../../lib/prisma.js';
import AppError from '../../errorHelpers/AppError.js';
import status from 'http-status';
import { IRequestUser } from '../../interfaces/requestUser.interface.js';
import {
  IChangeUserRolePayload,
  IChangeUserStatusPayload,
  IUpdateAdminPayload,
} from './admin.interface.js';
import { UserRole, UserStatus } from '../../../generated/prisma/enums.js';

/* ================= GET ALL ADMINS ================= */
const getAllAdmins = async () => {
  return await prisma.admin.findMany({
    where: { isDeleted: false },
    include: { user: true },
  });
};

/* ================= GET ADMIN BY ID ================= */
const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findUnique({
    where: { id, isDeleted: false },
    include: { user: true },
  });

  if (!admin) {
    throw new AppError(status.NOT_FOUND, 'Admin not found');
  }

  return admin;
};

/* ================= UPDATE ADMIN ================= */
const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
  const admin = await prisma.admin.findUnique({ where: { id } });

  if (!admin || admin.isDeleted) {
    throw new AppError(status.NOT_FOUND, 'Admin not found');
  }

  return await prisma.admin.update({
    where: { id },
    data: {
      ...payload.admin,
    },
  });
};

/* ================= DELETE ADMIN ================= */
const deleteAdmin = async (id: string, user: IRequestUser) => {
  const admin = await prisma.admin.findUnique({ where: { id } });

  if (!admin) {
    throw new AppError(status.NOT_FOUND, 'Admin not found');
  }

  if (admin.userId === user.userId) {
    throw new AppError(status.BAD_REQUEST, 'You cannot delete yourself');
  }

  return await prisma.$transaction(async tx => {
    await tx.admin.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: admin.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });

    await tx.session.deleteMany({
      where: { userId: admin.userId },
    });

    await tx.account.deleteMany({
      where: { userId: admin.userId },
    });

    return admin;
  });
};

/* ================= CHANGE USER STATUS ================= */
const changeUserStatus = async (
  user: IRequestUser,
  payload: IChangeUserStatusPayload,
) => {
  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.userId },
  });

  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id: payload.userId },
  });

  if (adminUser.id === targetUser.id) {
    throw new AppError(status.BAD_REQUEST, 'You cannot change your own status');
  }

  if (targetUser.role === UserRole.ADMIN && adminUser.role !== UserRole.ADMIN) {
    throw new AppError(status.BAD_REQUEST, 'Not allowed');
  }

  return await prisma.user.update({
    where: { id: payload.userId },
    data: { status: payload.userStatus },
  });
};

/* ================= CHANGE USER ROLE ================= */
const changeUserRole = async (
  user: IRequestUser,
  payload: IChangeUserRolePayload,
) => {
  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.userId },
  });

  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id: payload.userId },
  });

  if (adminUser.id === targetUser.id) {
    throw new AppError(status.BAD_REQUEST, 'You cannot change your own role');
  }

  if (targetUser.role === UserRole.USER) {
    throw new AppError(status.BAD_REQUEST, 'Cannot change role of user');
  }

  return await prisma.user.update({
    where: { id: payload.userId },
    data: { role: payload.role },
  });
};

export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  changeUserStatus,
  changeUserRole,
};
