import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';
import { bearer, emailOTP } from 'better-auth/plugins';
import { envVars } from '../config/env.js';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { sendEmail } from '../utils/email.js';

// -------------------- BETTER AUTH CONFIG --------------------
export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // ===============================
  // EMAIL + PASSWORD
  // ===============================
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  // ===============================
  // EXTRA USER FIELDS
  // ===============================
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

      needPasswordChange: {
        type: 'boolean',
        required: false,
        defaultValue: false,
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

  // ===============================
  // EMAIL VERIFICATION
  // ===============================
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },

  // ===============================
  // PLUGINS
  // ===============================

  plugins: [
    bearer(),

    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 10 * 60, // 10 min

      async sendVerificationOTP({ email, otp, type }) {
        try {
          const normalizedEmail = email.trim().toLowerCase();
          const normalizedOtp = String(otp).trim();

          console.log('📩 OTP TYPE:', type);
          console.log('📧 Sending OTP to:', normalizedEmail);

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            console.error(
              `User with email ${email} not found. Cannot send verification OTP.`,
            );
            return;
          }

          if (user && user.role === UserRole.ADMIN) {
            console.log(
              `User with email ${email} is a super admin. Skipping sending verification OTP.`,
            );
            return;
          }

          // ✅ only delete expired OTP
          await prisma.verification.deleteMany({
            where: {
              identifier: normalizedEmail,
              expiresAt: { lt: new Date() },
            },
          });

          // ✅ create OTP
          await prisma.verification.create({
            data: {
              id: crypto.randomUUID(),
              identifier: normalizedEmail,
              value: normalizedOtp,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
          });
          const verifyUrl = `${envVars.FRONTEND_URL}/reset-password?email=${normalizedEmail}&otp=${normalizedOtp}`;
          // ================= EMAIL VERIFICATION =================
          if (type === 'email-verification' && !user.emailVerified) {
            await sendEmail({
              to: normalizedEmail,
              subject: 'Verify your email (OTP)',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp: normalizedOtp,
                // verifyUrl,
              },
            });
          }

          // ================= FORGOT PASSWORD =================
          if (type === 'forget-password') {
            await sendEmail({
              to: normalizedEmail,
              subject: 'Password Reset OTP',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp: normalizedOtp,
                verifyUrl,
              },
            });
          }

          console.log(`✅ OTP sent to ${normalizedEmail}`);
        } catch (error) {
          console.error('❌ OTP SEND FAILED:', error);
          throw error;
        }
      },
    }),
  ],

  // ===============================
  // SOCIAL LOGIN
  // ===============================
  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,

      mapProfileToUser: () => {
        return {
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          needPasswordChange: false,
          emailVerified: true,
          isDeleted: false,
          deletedAt: null,
        };
      },
    },
  },

  // ===============================
  // SESSION
  // ===============================
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 24,

    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },

  // ===============================
  // REDIRECT
  // ===============================
  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },

  // ===============================
  // TRUSTED ORIGIN
  // ===============================
  trustedOrigins: [
    ...(envVars.FRONTEND_URL ? envVars.FRONTEND_URL.split(',') : []),

    envVars.BETTER_AUTH_URL,
    'http://localhost:3000',
    'http://localhost:5000',
  ]
    .filter(Boolean)
    .map(url => url.trim().replace(/\/$/, '')),

  // ===============================
  // ADVANCED COOKIE
  // ===============================
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
