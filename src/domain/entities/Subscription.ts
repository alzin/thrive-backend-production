// backend/src/domain/entities/Subscription.ts
export type SubscriptionPlan = 'monthly' | 'yearly' | 'one-time';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';

export interface ISubscription {
    id: string;
    userId: string;
    email: string; // NEW FIELD
    stripeCustomerId: string;
    stripeSubscriptionId?: string; // Optional for one-time payments
    stripePaymentIntentId?: string;
    subscriptionPlan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    createdAt: Date;
    updatedAt: Date;
}

export class Subscription implements ISubscription {
    constructor(
        public id: string,
        public userId: string,
        public email: string, // NEW FIELD
        public stripeCustomerId: string,
        public stripeSubscriptionId: string | undefined,
        public stripePaymentIntentId: string | undefined,
        public subscriptionPlan: SubscriptionPlan,
        public status: SubscriptionStatus,
        public currentPeriodStart: Date,
        public currentPeriodEnd: Date,
        public createdAt: Date,
        public updatedAt: Date
    ) { }

    isActive(): boolean {
        return this.status === 'active' && new Date() < this.currentPeriodEnd;
    }

    isExpired(): boolean {
        return new Date() > this.currentPeriodEnd;
    }
}