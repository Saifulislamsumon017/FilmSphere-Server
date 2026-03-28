import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';
import { bearer, emailOTP } from 'better-auth/plugins';
import { envVars } from '../config/env.js';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { sendEmail } from '../utils/email.js';

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    bearer(),

    emailOTP({
      overrideDefaultEmailVerification: true,

      async sendVerificationOTP({ email, otp, type }) {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return;

        if (type === 'forget-password') {
          await sendEmail({
            to: email,
            subject: 'Reset your password',
            templateName: 'otp',
            templateData: {
              name: user.name,
              otp,
            },
          });
        }
      },

      expiresIn: 2 * 60,
      otpLength: 6,
    }),
  ],

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID!,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET!,

      mapProfileToUser() {
        return {
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          isDeleted: false,
        };
      },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: UserRole.USER,
      },
      status: {
        type: 'string',
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      isDeleted: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: 'date',
        required: false,
      },
    },
  },

  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },

  trustedOrigins: [
    ...(envVars.FRONTEND_URL ? envVars.FRONTEND_URL.split(',') : []),
    envVars.BETTER_AUTH_URL,
    'http://localhost:3000',
    'http://localhost:5000',
  ]
    .filter(Boolean)
    .map(url => url.trim().replace(/\/$/, '')),

  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 24,

    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',

    cookies: {
      state: {
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        },
      },
      sessionToken: {
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        },
      },
    },
  },
});
