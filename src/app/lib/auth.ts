/* eslint-disable @typescript-eslint/no-explicit-any */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';
import { bearer, emailOTP } from 'better-auth/plugins';
import { envVars } from '../config/env.js';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';

// -------------------- EMAIL SENDER --------------------
const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  secure: true,
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
});

interface SendEmail {
  subject: string;
  to: string;
  templateName: string;
  templateData: Record<string, any>;
  attachment?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  subject,
  to,
  templateName,
  templateData,
  attachment,
}: SendEmail) => {
  try {
    const templatePath = path.resolve(
      process.cwd(),
      `src/app/template/${templateName}.ejs`,
    );

    const html = await ejs.renderFile(templatePath, templateData);

    const info = await transporter.sendMail({
      from: envVars.EMAIL_SENDER.SMTP_FROM,
      to,
      subject,
      html,
      attachments: attachment?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    });

    console.log(`✅ Email sent to ${to} : ${info.messageId}`);
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
  }
};

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
      expiresIn: 10 * 60, // ✅ increase for better UX

      async sendVerificationOTP({ email, otp, type }) {
        console.log('🔥 OTP TRIGGERED:', { email, otp, type });

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          console.error(`❌ User with email ${email} not found.`);
          return;
        }

        // ❌ Skip admin
        if (user.role === UserRole.ADMIN) {
          console.log(`⏭ Skipping OTP for admin ${email}`);
          return;
        }

        try {
          // ✅ Create verify URL (IMPORTANT)
          const verifyUrl = `${envVars.FRONTEND_URL}/verify-email?email=${email}&otp=${otp}`;

          // ✅ Email Verification OTP
          if (type.includes('email') && !user.emailVerified) {
            await sendEmail({
              to: email,
              subject: 'Verify your email (OTP)',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp,
                verifyUrl,
              },
            });

            console.log(`✅ OTP email sent to ${email}`);
          }

          // ✅ Forget Password OTP
          if (type.includes('password')) {
            await sendEmail({
              to: email,
              subject: 'Password Reset OTP',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp,
                verifyUrl,
              },
            });

            console.log(`✅ Password reset OTP sent to ${email}`);
          }
        } catch (err) {
          console.error('❌ OTP email failed:', err);
        }
      },
    }),
  ],

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackUrl: envVars.GOOGLE_CALLBACK_URL,
      mapProfileToUser: () => ({
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        isDeleted: false,
        deletedAt: null,
      }),
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

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    envVars.FRONTEND_URL,
  ],

  // trustedOrigins: [
  //   ...(envVars.FRONTEND_URL ? envVars.FRONTEND_URL.split(',') : []),
  //   envVars.BETTER_AUTH_URL,
  //   'http://localhost:3000',
  //   'http://localhost:5000',
  // ]
  //   .filter(Boolean)
  //   .map(url => url.trim().replace(/\/$/, '')),

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
