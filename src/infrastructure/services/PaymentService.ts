import Stripe from 'stripe';
import { IPaymentService, PaymentIntent } from '../../application/services/IPaymentService';


function daysToSecondsFromNow(days: number) {
  // Convert days to seconds (days * hours * minutes * seconds)
  const daysInSeconds = days * 24 * 60 * 60;
  // Get current time in seconds (Unix timestamp)
  const nowInSeconds = Math.floor(Date.now() / 1000);
  // Return the future timestamp in seconds
  return daysInSeconds + nowInSeconds;
}

export class PaymentService implements IPaymentService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  }

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
      clientSecret: intent.client_secret!
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
        clientSecret: intent.client_secret!
      };
    } catch (error) {
      return null;
    }
  }

  async createCustomer(email: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email });
    return customer.id;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async createCheckoutSession(params: {
    priceId: string;
    mode: 'payment' | 'subscription';
    successUrl: string;
    cancelUrl: string;
    metadata?: any;
    customerId?: string | null; // Added customerId as optional parameter
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

    // Add customer if customerId is provided
    if (params.customerId) {
      sessionConfig.customer = params.customerId;
    }

    else {
      sessionConfig.customer_email = params.metadata?.email
    }

    // Add subscription_data only for subscription mode
    if (params.mode === 'subscription' && !params.customerId && params.metadata.hasTrial !== false) {
      sessionConfig.subscription_data = {
        trial_end: daysToSecondsFromNow(Number(process.env.STRIPE_FREE_DAYS)) + 200
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionConfig);
    return session;
  }


  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      // We MUST expand line_items to see the price when the total paid is 0
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'line_items.data.price'], 
      });
      return session;
    } catch (error) {
      return null;
    }
  }

  constructWebhookEvent(payload: string, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      return event;
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
  // Add method to retrieve customer
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

  // Add method to retrieve subscription
  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      return null;
    }
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session | undefined> {

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;

    } catch (error) {
      console.log("error", error)
    }

  }

  async cancelTrialAndActivatePayment(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        trial_end: 'now',
        proration_behavior: 'create_prorations', // Optional: adjust billing for unused trial time
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error ending trial:', error);
      return null;
    }
  }



}
