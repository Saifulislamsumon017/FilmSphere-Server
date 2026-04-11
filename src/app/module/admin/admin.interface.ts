import { UserRole, UserStatus } from '../../../generated/prisma/enums.js';

export interface IUpdateAdminPayload {
  admin?: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
  };
}

export interface IChangeUserStatusPayload {
  userId: string;
  userStatus: UserStatus;
}

export interface IChangeUserRolePayload {
  userId: string;
  role: UserRole;
}

// export interface IAdminContext extends IRequestUser {}
