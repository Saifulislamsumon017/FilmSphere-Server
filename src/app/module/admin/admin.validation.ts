import z from 'zod';

export const updateAdminZodSchema = z.object({
  admin: z
    .object({
      name: z.string().optional(),

      profilePhoto: z.string().url().optional(),

      contactNumber: z.string().min(11).max(15).optional(),
    })
    .optional(),
});

export const changeUserStatusSchema = z.object({
  userId: z.string(),
  userStatus: z.enum(['ACTIVE', 'BANNED', 'SUSPENDED', 'DELETED']),
});

export const changeUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'USER']),
});

/* ACTIVE
  BANNED
  SUSPENDED
  DELETED */
