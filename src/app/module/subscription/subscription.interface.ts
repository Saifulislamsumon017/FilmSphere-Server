import { SubscriptionPlan } from '../../../generated/prisma/enums.js';

export interface ICreateSubscriptionPayload {
  planType: SubscriptionPlan;
}

export interface IConfirmSubscriptionPayload {
  sessionId: string;
}
