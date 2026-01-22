// backend/src/infrastructure/services/PaymentService.ts
import Stripe from 'stripe';
import { IPaymentService, PaymentIntent } from '../../domain/services/IPaymentService';
import { ENV_CONFIG } from '../config/env.config';

export class PaymentService implements IPaymentService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(ENV_CONFIG.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    });
    this.webhookSecret = ENV_CONFIG.STRIPE_WEBHOOK_SECRET!;
  }

  // ==================== Payment Intent Methods ====================

  async createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      clientSecret: intent.client_secret!,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return intent.status === 'succeeded';
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        clientSecret: intent.client_secret!,
      };
    } catch (error) {
      return null;
    }
  }

  // ==================== Customer Methods ====================

  async createCustomer(email: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email });
    return customer.id;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async retrieveCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        return null;
      }
      return customer as Stripe.Customer;
    } catch (error) {
      return null;
    }
  }

  async hasValidPaymentMethod(customerId: string): Promise<boolean> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data.length > 0;
    } catch (error) {
      return false;
    }
  }

  // ==================== Checkout Session Methods ====================

  async createCheckoutSession(params: {
    priceId: string;
    mode: 'payment' | 'subscription';
    successUrl: string;
    cancelUrl: string;
    metadata?: any;
    customerId?: string | null;
  }): Promise<Stripe.Checkout.Session> {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      automatic_tax: { enabled: true },
      metadata: params.metadata,
    };

    if (params.customerId) {
      sessionConfig.customer = params.customerId;
    } else {
      sessionConfig.customer_email = params.metadata?.email;
    }

    const trialDays = Number(ENV_CONFIG.STRIPE_FREE_DAYS) + 1;

    if (params.mode === 'subscription' && !params.customerId && params.metadata?.hasTrial !== false) {
      sessionConfig.subscription_data = {
        trial_end: this.daysToSecondsFromNow(trialDays),
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionConfig);
    return session;
  }

  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'line_items.data.price'],
      }); return session;
    } catch (error) {
      return null;
    }
  }

  async verifyCheckoutSession(sessionId: string) {
    // 1. Retrieve session AND expand subscription to check trial status
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items', 'payment_intent'],
    });

    if (!session) {
      throw new Error('Session not found');
    }

    let isTrial = false;
    let planInterval = 'month';
    let planName = 'Subscription';

    // 2. LOGIC: Determine if it is a Trial
    if (session.subscription && typeof session.subscription !== 'string') {
      // Check if status is 'trialing' OR if there is a trial_end date in the future
      if (
        session.subscription.status === 'trialing' ||
        (session.subscription.trial_end && session.subscription.trial_end > Date.now() / 1000)
      ) {
        isTrial = true;
      }

      // Get Plan details
      const item = session.subscription.items.data[0];
      if (item && item.price) {
        planInterval = item.price.recurring?.interval || 'month';
      }
    }

    // 3. Return the payload matching your Frontend Interface
    return {
      status: session.payment_status, // 'paid' or 'unpaid'
      customerEmail: session.customer_details?.email,
      transactionDetails: {
        transactionId: session.id,
        // IMPORTANT: Send raw amount_total (e.g., 2000 for $20). 
        // The frontend will handle the division.
        value: session.amount_total || 0,
        currency: session.currency?.toUpperCase() || 'USD',

        // Subscription Details
        plan: session.metadata?.plan || 'unknown_plan',
        name: planName,
        interval: planInterval,

        // The calculated boolean
        isTrial: isTrial,

        subscriptionId: typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id,
        customerId: typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id,
      },
      metadata: session.metadata
    };
  }
  

  async createUpgradeCheckoutSession(params: {
    customerId: string;
    subscriptionId: string;
    newPriceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: any;
  }): Promise<Stripe.Checkout.Session> {
    const { customerId, subscriptionId, newPriceId, successUrl, cancelUrl, metadata } = params;

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: newPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        isUpgrade: 'true',
        previousSubscriptionId: subscriptionId,
      },
      subscription_data: {
        metadata: {
          ...metadata,
          upgradedFrom: subscriptionId,
        },
      },
    });

    return session;
  }

  // ==================== Subscription Methods ====================

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      return null;
    }
  }

  async upgradeSubscription(params: {
    subscriptionId: string;
    newPriceId: string;
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  }): Promise<Stripe.Subscription> {
    const { subscriptionId, newPriceId, prorationBehavior = 'create_prorations' } = params;

    // First, retrieve the current subscription to get the item ID
    const currentSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!currentSubscription || currentSubscription.items.data.length === 0) {
      throw new Error('Subscription not found or has no items');
    }

    const subscriptionItemId = currentSubscription.items.data[0].id;

    // Update the subscription with the new price
    const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
      // If on trial, this will end it and start billing
      trial_end: currentSubscription.trial_end ? 'now' : undefined,
    });

    return updatedSubscription;
  }

  async cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async cancelTrialAndActivatePayment(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        trial_end: 'now',
        proration_behavior: 'create_prorations',
      });
      return updatedSubscription;
    } catch (error) {
      console.error('Error ending trial:', error);
      return null;
    }
  }

  // ==================== Portal Methods ====================

  async createCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session | undefined> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      console.log('error', error);
      return undefined;
    }
  }

  // ==================== Webhook Methods ====================

  constructWebhookEvent(payload: string, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return event;
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // ==================== Helper Methods ====================

  private daysToSecondsFromNow(days: number): number {
    const daysInSeconds = days * 24 * 60 * 60;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return daysInSeconds + nowInSeconds;
  }
}