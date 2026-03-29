/* eslint-disable @typescript-eslint/no-explicit-any */

import { UserRole } from '../../generated/prisma/enums.js';
import { envVars } from '../config/env.js';
import { auth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const seedAdmin = async () => {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: envVars.ADMIN_EMAIL,
      },
    });

    if (existingUser) {
      if (existingUser.role !== UserRole.ADMIN) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: UserRole.ADMIN },
        });
      }

      const adminEntry = await prisma.admin.findFirst({
        where: { userId: existingUser.id },
      });
      if (!adminEntry) {
        await prisma.admin.create({
          data: {
            userId: existingUser.id,
            name: 'Admin',
            email: envVars.ADMIN_EMAIL,
          },
        });
      }
      console.log('Admin already exists (role ensured)');
      return;
    }

    const adminData = await auth.api.signUpEmail({
      body: {
        email: envVars.ADMIN_EMAIL,
        password: envVars.ADMIN_PASSWORD,
        name: 'Admin',
      },
    });

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: {
          id: adminData.user.id,
        },
        data: {
          emailVerified: true,
          role: UserRole.ADMIN,
        },
      });

      await tx.admin.create({
        data: {
          userId: adminData.user.id,
          name: 'Admin',
          email: envVars.ADMIN_EMAIL,
        },
      });
    });
    await prisma.admin.findFirst({
      where: {
        email: envVars.ADMIN_EMAIL,
      },
      include: {
        user: true,
      },
    });
  } catch (error) {
    console.error('Error seeding  admin: ', error);
  }
};
