import Stripe from 'stripe';
import { envVars } from './env.js';

if (!envVars.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

export const STRIPE_PLANS = {
  MONTHLY: {
    priceId: envVars.STRIPE_MONTHLY_PRICE_ID || '',
    name: 'Monthly Subscription',
    interval: 'month',
  },
  YEARLY: {
    priceId: envVars.STRIPE_YEARLY_PRICE_ID || '',
    name: 'Yearly Subscription',
    interval: 'year',
  },
};

if (!STRIPE_PLANS.MONTHLY.priceId) {
  console.warn('Warning: STRIPE_MONTHLY_PRICE_ID is not configured');
}

if (!STRIPE_PLANS.YEARLY.priceId) {
  console.warn('Warning: STRIPE_YEARLY_PRICE_ID is not configured');
}
