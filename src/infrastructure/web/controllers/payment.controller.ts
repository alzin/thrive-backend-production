// backend/src/infrastructure/web/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../services/PaymentService';
import { PaymentRepository } from '../../database/repositories/PaymentRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { Payment } from '../../../domain/repositories/IPaymentRepository';
import { Subscription } from '../../../domain/entities/Subscription';
import { AuthRequest } from '../middleware/auth.middleware';
import { HandleSubscriptionWebhookUseCase } from '../../../application/use-cases/subscription/HandleSubscriptionWebhookUseCase';
import { SubscriptionRepository } from '../../database/repositories/SubscriptionRepository';

export class PaymentController {
  private paymentRepository: PaymentRepository;
  private userRepository: UserRepository;
  private paymentService: PaymentService;
  private subscriptionRepository: SubscriptionRepository;

  // Discount configuration
  private readonly DISCOUNT_LIMIT = Number(process.env.STRIPE_DISCOUNT_LIMIT_USERS);
  private readonly DISCOUNT_PRICES = {
    monthly: {
      regular: process.env.STRIPE_MONTHLY_PRICE_ID || '',
      discounted: process.env.STRIPE_MONTHLY_DISCOUNT_PRICE_ID || ''
    },
    yearly: {
      regular: process.env.STRIPE_YEARLY_PRICE_ID || '',
      discounted: process.env.STRIPE_YEARLY_DISCOUNT_PRICE_ID || ''
    },

    monthlySpecial: {
      regular: process.env.STRIPE_MONTHLY_PRICE_ID_SPECIAL || '',
      discounted: process.env.STRIPE_MONTHLY_PRICE_ID_SPECIAL || ''
    }
  };

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.userRepository = new UserRepository();
    this.paymentService = new PaymentService();
    this.subscriptionRepository = new SubscriptionRepository();

  }

  // New endpoint to check discount eligibility
  checkDiscountEligibility = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isEligible, remainingSpots, totalUsed } = await this.getDiscountStatus();

      res.json({
        isEligible,
        remainingSpots,
        totalUsed,
        limit: this.DISCOUNT_LIMIT
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to get discount status
  private async getDiscountStatus(): Promise<{ isEligible: boolean; remainingSpots: number; totalUsed: number }> {
    // Get count of unique users who have completed payments (excluding failed payments)
    const allPayments = await this.subscriptionRepository.getAllAcivePayment();

    const totalUsed = allPayments.length;
    const remainingSpots = Math.max(0, this.DISCOUNT_LIMIT - totalUsed);
    const isEligible = totalUsed < this.DISCOUNT_LIMIT;

    return { isEligible, remainingSpots, totalUsed };
  }


  createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount = 5000, currency = 'usd', email } = req.body;

      const metadata: any = {
        description: 'Thrive in Japan LMS Access'
      };

      // If email is provided, include it in metadata
      if (email) {
        metadata.email = email;
      }

      const paymentIntent = await this.paymentService.createPaymentIntent(amount, currency, metadata);

      res.json({
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });
    } catch (error) {
      next(error);
    }
  }

  createCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mode = 'payment', successUrl, cancelUrl, metadata, planType } = req.body;
      const email = req.user!.email;
      const userId = req.user!.userId;

      // Check discount eligibility
      const { isEligible } = await this.getDiscountStatus();

      // Determine which price ID to use based on eligibility
      let finalPriceId = "";

      if (isEligible && planType && this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES]) {
        // Use discounted price if eligible
        finalPriceId = this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES].discounted;
      } else if (planType && this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES]) {
        // Use regular price if not eligible
        finalPriceId = this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES].regular;
      }

      const subscription = await this.subscriptionRepository.findByUserId(userId)

      const sessionData = {
        priceId: finalPriceId,
        mode,
        successUrl,
        cancelUrl,
        metadata: {
          ...metadata,
          email,
          userId,
          isDiscounted: isEligible ? 'true' : 'false',
          planType: planType || 'unknown'
        },
        customerId: subscription ? subscription.stripeCustomerId : null
      };

      const session = await this.paymentService.createCheckoutSession(sessionData);

      res.json({
        sessionId: session.id,
        isDiscounted: isEligible
      });
    } catch (error) {
      next(error);
    }
  }

verifyCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.body;

      // 1. Retrieve Session (Now includes line_items)
      const session = await this.paymentService.retrieveCheckoutSession(sessionId);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const planType = session.metadata?.planType || 'unknown_plan';
      const planName = `Thrive ${planType.charAt(0).toUpperCase() + planType.slice(1)} Subscription`;
      const isTrial = session.total_details?.amount_tax === 0 && session.amount_total === 0;

      // -------------------------------------------------------
      // LOGIC: DETERMINE REAL VALUE
      // -------------------------------------------------------
      let finalValue = session.amount_total || 0;

      // If Stripe says 0 (Trial/Free), we look up the real price
      if (finalValue === 0) {
        
        // Strategy A: Dynamic lookup from Stripe Line Items
        // This will now work because we updated PaymentService!
        if (session.line_items?.data?.[0]?.price?.unit_amount) {
          finalValue = session.line_items.data[0].price.unit_amount;
        } 
    
      }
      // -------------------------------------------------------

      res.json({
        status: session.payment_status,
        paymentIntentId: session.payment_intent,
        metadata: session.metadata,
        transactionDetails: {
          transactionId: session.id,
          name: planName,
          value: finalValue, // ✅ Now sends 8800 instead of 0
          currency: session.currency?.toUpperCase() || 'JPY',
          plan: planType,
          subscriptionId: session.subscription as string || 'sub_pending',
          customerId: session.customer as string || 'cus_guest',
          isTrial: isTrial,
          interval: session.metadata?.interval || 'monthly'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;

    try {
      const event = this.paymentService.constructWebhookEvent(req.body, sig);
      console.log(`📍 Webhook received: ${event.type}`);

      // Initialize the subscription webhook handler
      const subscriptionWebhookHandler = new HandleSubscriptionWebhookUseCase(
        new SubscriptionRepository(),
        new UserRepository(),
        this.paymentService
      );

      // Handle subscription-related events with the use case
      const subscriptionEvents = [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.subscription.trial_will_end'
      ];

      if (subscriptionEvents.includes(event.type)) {
        await subscriptionWebhookHandler.execute({ event });
        res.json({ received: true });
        return;
      }

      // Handle other events (your existing code for non-subscription events)
      switch (event.type) {
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as any);
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('❌ Webhook error:', error.message);
      res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
  };

  private async getEmailFromCustomer(customerId: string): Promise<string | null> {
    try {
      const customer = await this.paymentService.retrieveCustomer(customerId);
      return customer?.email || null;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  }

  private async extractEmail(source: any): Promise<string | null> {
    // Try multiple sources for email
    return source.metadata?.email ||
      source.customer_email ||
      (source.customer ? await this.getEmailFromCustomer(source.customer) : null);
  }

  private handleCheckoutSessionCompleted = async (session: any): Promise<void> => {
    try {
      console.log('✅ checkout.session.completed:', session.id);

      // Skip if already processed
      if (session.payment_intent) {
        const existingPayment = await this.paymentRepository.findByStripePaymentIntentId(session.payment_intent);
        if (existingPayment) {
          console.log('Payment already exists, skipping...');
          return;
        }
      }

      const email = await this.extractEmail(session);
      if (!email) {
        console.error('❌ No email found for session:', session.id);
        return;
      }

      // Determine payment type based on mode
      const paymentType = session.mode === 'subscription' ? 'subscription' : 'one-time';

      // For subscriptions, we'll handle the actual payment in invoice.payment_succeeded
      if (session.mode === 'subscription') {
        console.log('📝 Subscription checkout completed, waiting for invoice.payment_succeeded');
        return;
      }

      // Record one-time payment
      const payment: Payment = {
        id: this.generatePaymentId(),
        email,
        stripePaymentIntentId: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
        status: 'COMPLETED',
        metadata: {
          type: paymentType,
          sessionId: session.id,
          customerId: session.customer || null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.paymentRepository.create(payment);
      console.log('💾 One-time payment recorded:', payment.id);
    } catch (error) {
      console.error('❌ Error in handleCheckoutSessionCompleted:', error);
      throw error;
    }
  };

  private handleInvoicePaymentSucceeded = async (invoice: any): Promise<void> => {
    try {
      console.log('✅ invoice.payment_succeeded:', invoice.id);

      // Skip if already processed
      if (invoice.payment_intent) {
        const existingPayment = await this.paymentRepository.findByStripePaymentIntentId(invoice.payment_intent);
        if (existingPayment) {
          console.log('Payment already exists, skipping...');
          return;
        }
      }

      const email = await this.extractEmail(invoice);
      if (!email) {
        console.error('❌ No email found for invoice:', invoice.id);
        return;
      }

      // Get subscription details
      const subscriptionId = invoice.subscription;
      let interval = 'unknown';
      let subscriptionDetail = null;

      if (subscriptionId) {
        try {
          subscriptionDetail = await this.paymentService.retrieveSubscription(subscriptionId);
          interval = subscriptionDetail?.items.data[0]?.price.recurring?.interval || 'unknown';
        } catch (err) {
          console.error('Error fetching subscription details:', err);
        }
      }

      const payment: Payment = {
        id: this.generatePaymentId(),
        email,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'COMPLETED',
        metadata: {
          type: 'subscription',
          interval, // 'month' or 'year'
          invoiceId: invoice.id,
          subscriptionId,
          customerId: invoice.customer,
          billingReason: invoice.billing_reason, // 'subscription_create', 'subscription_cycle', etc.
          periodStart: new Date(invoice.period_start * 1000).toISOString(),
          periodEnd: new Date(invoice.period_end * 1000).toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.paymentRepository.create(payment);
      console.log(`💾 ${interval}ly subscription payment recorded:`, payment.id);
    } catch (error) {
      console.error('❌ Error in handleInvoicePaymentSucceeded:', error);
      throw error;
    }
  };

  private handleSubscriptionCreated = async (subscription: any): Promise<void> => {
    try {
      console.log('🔔 customer.subscription.created:', subscription.id);

      // Log subscription creation but don't create payment record
      // Actual payment will be recorded when invoice.payment_succeeded fires
      const email = await this.extractEmail(subscription);
      const interval = subscription.items.data[0]?.price.recurring?.interval || 'unknown';

      console.log(`📅 New ${interval}ly subscription created for ${email || 'unknown'}`);
    } catch (error) {
      console.error('❌ Error in handleSubscriptionCreated:', error);
    }
  };

  private handleSubscriptionUpdated = async (subscription: any): Promise<void> => {
    try {
      console.log('🔄 customer.subscription.updated:', subscription.id);

      // You can add logic here to update user subscription status in your database
      const status = subscription.status;
      const cancelAtPeriodEnd = subscription.cancel_at_period_end;

      console.log(`📝 Subscription ${subscription.id} updated - Status: ${status}, Cancel at period end: ${cancelAtPeriodEnd}`);
    } catch (error) {
      console.error('❌ Error in handleSubscriptionUpdated:', error);
    }
  };

  private handleSubscriptionDeleted = async (subscription: any): Promise<void> => {
    try {
      console.log('🚫 customer.subscription.deleted:', subscription.id);

      // You can add logic here to update user access in your database
      const email = await this.extractEmail(subscription);
      console.log(`❌ Subscription cancelled for ${email || 'unknown'}`);
    } catch (error) {
      console.error('❌ Error in handleSubscriptionDeleted:', error);
    }
  };

  private handlePaymentFailed = async (paymentIntent: any): Promise<void> => {
    try {
      console.log('❌ payment_intent.payment_failed:', paymentIntent.id);

      const email = await this.extractEmail(paymentIntent);
      if (!email) return;

      const payment: Payment = {
        id: this.generatePaymentId(),
        email,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'FAILED',
        metadata: {
          type: 'failed',
          failureCode: paymentIntent.last_payment_error?.code || 'unknown',
          failureMessage: paymentIntent.last_payment_error?.message || '',
          customerId: paymentIntent.customer || null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.paymentRepository.create(payment);
      console.log('💾 Failed payment recorded:', payment.id);
    } catch (error) {
      console.error('❌ Error in handlePaymentFailed:', error);
      throw error;
    }
  };

  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  endTrial = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    if (!userId) {
      res.status(400).json({ error: 'User Not Found' });
      return;
    }

    try {
      const subscription = await this.subscriptionRepository.findByUserId(userId);

      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      const subscriptionId = subscription.stripeSubscriptionId;

      if (!subscriptionId) {
        res.status(400).json({ error: 'subscriptionId Not Found' });
        return;
      }

      const data = await this.paymentService.cancelTrialAndActivatePayment(subscriptionId);

      if (!data) {
        res.status(500).json({ error: 'Failed to cancel trial' });
        return;
      }

      res.status(200).json({ message: 'Trial ended and payment activated', data });
    }
    catch (error) {
      next(error);
    }
  }

  createCustomerPortal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    if (!userId) {
      res.status(400).json({ error: 'User Not Found' });
      return;
    }

    try {
      const subscription = await this.subscriptionRepository.findByUserId(userId);

      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      const stripeCustomerId = subscription.stripeCustomerId;

      if (!stripeCustomerId) {
        res.status(400).json({ error: 'stripeCustomerId Not Found' });
        return;
      }

      const session = await this.paymentService.createCustomerPortalSession(stripeCustomerId, `${process.env.FRONTEND_URL}/dashboard`);

      if (!session) {
        res.status(500).json({ error: 'Failed to createCustomerPortalSession' });
        return;
      }

      res.status(200).json({ message: 'Create Customer Portal Session Successful', session });
    }
    catch (error) {
      next(error);
    }
  }
}