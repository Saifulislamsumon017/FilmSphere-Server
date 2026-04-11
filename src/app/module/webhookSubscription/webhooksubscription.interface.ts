import { SubscriptionPlan } from '../../../generated/prisma/enums.js';

export interface ICreateSubscription {
  planType: SubscriptionPlan;
}
