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
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  user: {
    additionalFields: {
      role: { type: 'string', required: true, defaultValue: UserRole.USER },
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

      isDeleted: { type: 'boolean', required: true, defaultValue: false },
      deletedAt: { type: 'date', required: false, defaultValue: null },
    },
  },

  // ----------------- Email Verification -----------------
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,

    // async sendVerificationEmail({ user, url }) {
    //   try {
    //     await sendEmail({
    //       to: user.email,
    //       subject: 'Verify your email',
    //       templateName: 'verify-email',
    //       templateData: {
    //         name: user.name,
    //         verifyLink: url,
    //       },
    //     });
    //     console.log(`✅ Verification email sent to ${user.email}`);
    //   } catch (err) {
    //     console.error('❌ Verification email failed:', err);
    //   }
    // },
  },

  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 10 * 60,

      async sendVerificationOTP({ email, otp, type }) {
        console.log('🔥 OTP TRIGGERED:', { email, otp, type });

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return;

        if (user.role === UserRole.ADMIN) return;

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = String(otp).trim();

        try {
          // 🔥 DELETE OLD OTPs (important)
          await prisma.verification.deleteMany({
            where: { identifier: normalizedEmail },
          });

          // 🔥 SAVE OTP IN YOUR DB
          await prisma.verification.create({
            data: {
              id: crypto.randomUUID(),
              identifier: normalizedEmail,
              value: normalizedOtp,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
            },
          });

          const verifyUrl = `${envVars.FRONTEND_URL}/verify-email?email=${normalizedEmail}&otp=${normalizedOtp}`;

          // 📩 SEND EMAIL
          if (type.includes('email') && !user.emailVerified) {
            await sendEmail({
              to: normalizedEmail,
              subject: 'Verify your email (OTP)',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp: normalizedOtp,
                verifyUrl,
              },
            });

            console.log(`✅ OTP sent to ${normalizedEmail}`);
          }
        } catch (err) {
          console.error('❌ OTP send failed:', err);
        }
      },
    }),
  ],

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      // callbackUrl: envVars.GOOGLE_CALLBACK_URL,
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

  session: {
    expiresIn: 60 * 60 * 24, // 1 day
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 60 * 24 },
  },

  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },

  // trustedOrigins: [
  //   process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  //   envVars.FRONTEND_URL,
  // ],

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
