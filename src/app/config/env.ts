import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  FRONTEND_URL: string;
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_IN: string;
  REFRESH_TOKEN_IN: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  STRIPE_SECRET_KEY: string;
  STRIPE_MONTHLY_PRICE_ID: string;
  STRIPE_YEARLY_PRICE_ID: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  BACKEND_URL: string;
  EMAIL_SENDER: {
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_FROM: string;
  };
}

const loadEnvVariables = (): EnvConfig => {
  const requireEnvVariable = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'FRONTEND_URL',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'ACCESS_TOKEN_IN',
    'REFRESH_TOKEN_IN',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_MONTHLY_PRICE_ID',
    'STRIPE_YEARLY_PRICE_ID',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'BACKEND_URL',
    'EMAIL_SENDER_SMTP_USER',
    'EMAIL_SENDER_SMTP_PASS',
    'EMAIL_SENDER_SMTP_HOST',
    'EMAIL_SENDER_SMTP_PORT',
    'EMAIL_SENDER_SMTP_FROM',
  ];

  requireEnvVariable.forEach(variable => {
    if (!process.env[variable]) {
      throw new Error(
        `Environment variable ${variable} is required but not set in .env file.`,
      );
      // throw new AppError(
      //   status.INTERNAL_SERVER_ERROR,
      //   `Environment variable ${variable} is required but not set in .env file.`,
      // );
    }
  });
  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN as string,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN as string,
    ACCESS_TOKEN_IN: process.env.ACCESS_TOKEN_IN as string,
    REFRESH_TOKEN_IN: process.env.REFRESH_TOKEN_IN as string,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
    STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID as string,
    STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    BACKEND_URL: process.env.BACKEND_URL as string,
    EMAIL_SENDER: {
      SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
      SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS as string,
      SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
      SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT as string,
      SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string,
    },
  };
};

export const envVars = loadEnvVariables();
