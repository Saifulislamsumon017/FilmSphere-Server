import { UserRole } from '../../generated/prisma/enums.js';

export interface IRequestUser {
  userId: string;
  role: UserRole;
  email: string;
}
