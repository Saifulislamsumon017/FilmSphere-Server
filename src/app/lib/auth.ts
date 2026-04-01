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
    provider: 'postgresql', // or "mysql", "postgresql", ...etc
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
        defaultValue: null,
      },
    },
  },

  // emailVerification: {
  //   sendOnSignUp: true,
  //   sendOnSignIn: true,
  //   autoSignInAfterVerification: true,
  // },

  // 📧 Email Verification (LINK SYSTEM)
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,

    async sendVerificationEmail({ user, url }) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify your email',
          templateName: 'verify-email',
          templateData: {
            name: user.name,
            verifyLink: url,
          },
        });
      } catch (err) {
        console.error('Verification email failed:', err);
      }
    },
  },

  plugins: [
    bearer(),
    emailOTP({
      // overrideDefaultEmailVerification: true,

      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'email-verification') {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          if (!user) {
            console.error(
              `User with email ${email} not found. Cannot send verification OTP.`,
            );
            return;
          }

          if (user && user.role === UserRole.ADMIN) {
            console.log(
              `User with email ${email} is a admin. Skipping sending verification OTP.`,
            );
            return;
          }

          if (user && !user.emailVerified) {
            sendEmail({
              to: email,
              subject: 'Verify your email',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp,
              },
            });
          }
        } else if (type === 'forget-password') {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          if (user) {
            sendEmail({
              to: email,
              subject: 'Password Reset OTP',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp,
              },
            });
          }
        }
      },
      expiresIn: 2 * 60, // 2 minutes in seconds
      otpLength: 6,
    }),
  ],

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackUrl: envVars.GOOGLE_CALLBACK_URL,
      mapProfileToUser: () => {
        return {
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          isDeleted: false,
          deletedAt: null,
        };
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
    updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
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

  advanced: {
    useSecureCookies: envVars.NODE_ENV === 'production',

    cookies: {
      state: {
        attributes: {
          httpOnly: true,
          secure: envVars.NODE_ENV === 'production',
          sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        },
      },
      sessionToken: {
        attributes: {
          httpOnly: true,
          secure: envVars.NODE_ENV === 'production',
          sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        },
      },
    },
  },
});
