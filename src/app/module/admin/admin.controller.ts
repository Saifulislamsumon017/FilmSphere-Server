import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { AdminService } from './admin.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

/* ================= GET ALL ================= */
const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllAdmins();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Admins fetched successfully',
    data: result,
  });
});

/* ================= GET BY ID ================= */
const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdminService.getAdminById(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Admin fetched successfully',
    data: result,
  });
});

/* ================= UPDATE ================= */
const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const result = await AdminService.updateAdmin(id as string, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Admin updated successfully',
    data: result,
  });
});

/* ================= DELETE ================= */
const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const result = await AdminService.deleteAdmin(id as string, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Admin deleted successfully',
    data: result,
  });
});

/* ================= STATUS ================= */
const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const result = await AdminService.changeUserStatus(user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Status updated successfully',
    data: result,
  });
});

/* ================= ROLE ================= */
const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const result = await AdminService.changeUserRole(user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Role updated successfully',
    data: result,
  });
});

export const AdminController = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  changeUserStatus,
  changeUserRole,
};
