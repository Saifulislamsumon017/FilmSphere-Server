import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import qs from 'qs';
import { envVars } from './app/config/env.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './app/lib/auth.js';
import cookieParser from 'cookie-parser';
import { IndexRoutes } from './app/routes/index.js';
import { globalErrorHandler } from './app/middleware/globalErrorHandler.js';
import { notFound } from './app/middleware/notFound.js';
import { seedAdmin } from './app/seedAdmin/seedAdmin.js';
import { paymentController } from './app/module/payment/payment.controller.js';
import { subscriptionController } from './app/module/webhookSubscription/webhooksubscription.controller.js';

const app: Application = express();

app.set('query parser', (str: string) => qs.parse(str));

// Initialize default admin account on application startup
seedAdmin();

app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), `src/app/templates`));

app.post(
  '/api/v1/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhookEvent,
);
app.post(
  '/api/v1/subscription/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleStripeWebhookEvent,
);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        ...(envVars.FRONTEND_URL ? envVars.FRONTEND_URL.split(',') : []),
        envVars.BETTER_AUTH_URL,
        'http://localhost:3000',
        'http://localhost:5000',
      ]
        .filter(Boolean)
        .map(url => url.trim().replace(/\/$/, ''));

      // Allow if origin is in list, or if it's a Vercel/Netlify preview
      if (
        !origin ||
        allowed.includes(origin.replace(/\/$/, '')) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'cache',
      'Pragma',
      'x-requested-with',
    ],
  }),
);

app.use('/api/auth', toNodeHandler(auth));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', IndexRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'FilmSphere API is up and running successfully',
  });
  // res.send('FilmSphere API is up and running successfully');
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
