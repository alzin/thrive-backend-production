// backend/src/application/use-cases/payment/HandleSubscriptionWebhookUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ISubscriptionRepository } from '../../../domain/repositories/ISubscriptionRepository';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../../domain/entities/Subscription';
import { PaymentService } from '../../../infrastructure/services/PaymentService';
import Stripe from 'stripe';

export interface HandleSubscriptionWebhookDTO {
    event: Stripe.Event;
}

export class HandleSubscriptionWebhookUseCase {
    constructor(
        private subscriptionRepository: ISubscriptionRepository,
        private userRepository: IUserRepository,
        private paymentService: PaymentService
    ) { }

    async execute(dto: HandleSubscriptionWebhookDTO): Promise<void> {
        const { event } = dto;

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
                await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.trial_will_end':
                await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled subscription event type: ${event.type}`);
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        console.log('📍 Processing checkout.session.completed:', session.id);

        const userId = session.metadata?.userId;
        const email = session.customer_email || session.metadata?.email;

        if (!userId || !email) {
            console.error('❌ Missing userId or email in session metadata');
            return;
        }

        // Verify user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            console.error('❌ User not found:', userId);
            return;
        }

        // Handle one-time payment (one-time plan)
        if (session.mode === 'payment') {
            await this.handleOneTimePayment(session, userId, email);
        }
        // Subscription will be handled by customer.subscription.created event
    }

    private async handleOneTimePayment(session: Stripe.Checkout.Session, userId: string, email: string): Promise<void> {
        console.log('💳 Processing one-time payment for one-time access');

        // Create or get customer
        let customerId = session.customer as string;
        if (!customerId && session.customer_email) {
            customerId = await this.paymentService.createCustomer(session.customer_email);
        }

        // Calculate one-time period (e.g., 100 years)
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);

        // Check if user already has a subscription
        const existingSubscription = await this.subscriptionRepository.findByUserId(userId);

        if (existingSubscription) {
            // Update existing subscription
            existingSubscription.email = email;
            existingSubscription.stripeCustomerId = customerId;
            existingSubscription.stripePaymentIntentId = session.payment_intent as string;
            existingSubscription.subscriptionPlan = 'one-time' as SubscriptionPlan;
            existingSubscription.status = 'active';
            existingSubscription.currentPeriodStart = currentPeriodStart;
            existingSubscription.currentPeriodEnd = currentPeriodEnd;
            existingSubscription.updatedAt = new Date();

            await this.subscriptionRepository.update(existingSubscription);
            console.log('✅ Existing subscription updated to one-time:', existingSubscription.id);
        } else {
            // Create new subscription
            const subscription = new Subscription(
                this.generateSubscriptionId(),
                userId,
                email,
                customerId,
                undefined, // No subscription ID for one-time payments
                session.payment_intent as string,
                'one-time' as SubscriptionPlan,
                'active',
                currentPeriodStart,
                currentPeriodEnd,
                new Date(),
                new Date()
            );

            await this.subscriptionRepository.create(subscription);
            console.log('✅ One-time subscription created:', subscription.id);
        }
    }

    private async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {
        console.log('🔔 Processing customer.subscription.created:', stripeSubscription.id);

        const email = await this.getEmailFromCustomer(stripeSubscription.customer as string);
        if (!email) {
            console.error('❌ Missing email in subscription metadata');
            return;
        }

        const user = await this.userRepository.findByEmail(email);
        const userId = user?.id;

        if (!userId) {
            console.error('❌ Missing userId in subscription metadata');
            return;
        }

        // Check if user already has a subscription (one-to-one relationship)
        const existingSubscription = await this.subscriptionRepository.findByUserId(userId);

        // Get plan details
        const plan = this.extractPlanFromSubscription(stripeSubscription);
        const status = this.mapStripeStatusToSubscriptionStatus(stripeSubscription.status);

        if (existingSubscription) {
            // Update existing subscription

            // Update subscription details
            existingSubscription.email = email;
            existingSubscription.stripeCustomerId = stripeSubscription.customer as string;
            existingSubscription.stripeSubscriptionId = stripeSubscription.id;
            existingSubscription.subscriptionPlan = plan;
            existingSubscription.status = status;
            existingSubscription.currentPeriodStart = new Date(stripeSubscription.items.data[0].current_period_start * 1000);
            existingSubscription.currentPeriodEnd = new Date(stripeSubscription.items.data[0].current_period_end * 1000);
            existingSubscription.updatedAt = new Date();

            await this.subscriptionRepository.update(existingSubscription);
            console.log('✅ Existing subscription updated:', existingSubscription.id);
        } else {
            // Create new subscription
            const subscription = new Subscription(
                this.generateSubscriptionId(),
                userId,
                email,
                stripeSubscription.customer as string,
                stripeSubscription.id,
                undefined, // Payment intent will be linked in invoice.payment_succeeded
                plan,
                status,
                new Date(stripeSubscription.items.data[0].current_period_start * 1000),
                new Date(stripeSubscription.items.data[0].current_period_end * 1000),
                new Date(),
                new Date()
            );

            await this.subscriptionRepository.create(subscription);
            console.log('✅ Subscription created:', subscription.id);
        }
    }

    private async getEmailFromCustomer(customerId: string): Promise<string | null> {
        try {
            const customer = await this.paymentService.retrieveCustomer(customerId);
            return customer?.email || null;
        } catch (error) {
            console.error('Error retrieving customer:', error);
            return null;
        }
    }

    private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
        console.log('🔄 Processing customer.subscription.updated:', stripeSubscription);

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.id);
        if (!subscription) {
            console.error('❌ Subscription not found:', stripeSubscription.id);
            // Try to create it if it doesn't exist
            await this.handleSubscriptionCreated(stripeSubscription);
            return;
        }

        // Update subscription details
        subscription.status = this.mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
        subscription.currentPeriodStart = new Date(stripeSubscription.items.data[0].current_period_start * 1000);
        subscription.currentPeriodEnd = new Date(stripeSubscription.items.data[0].current_period_end * 1000);
        subscription.updatedAt = new Date();

        // Check if plan changed
        const newPlan = this.extractPlanFromSubscription(stripeSubscription);
        if (newPlan !== subscription.subscriptionPlan) {
            console.log(`📝 Plan changed from ${subscription.subscriptionPlan} to ${newPlan}`);
            subscription.subscriptionPlan = newPlan;
        }

        await this.subscriptionRepository.update(subscription);
        console.log('✅ Subscription updated:', subscription.id);
    }

    private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
        console.log('🚫 Processing customer.subscription.deleted:', stripeSubscription.id);

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.id);
        if (!subscription) {
            console.error('❌ Subscription not found:', stripeSubscription.id);
            return;
        }

        subscription.status = 'canceled';
        subscription.updatedAt = new Date();

        await this.subscriptionRepository.update(subscription);
        console.log('✅ Subscription canceled:', subscription.id);
    }

    private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
        console.log('💰 Processing invoice.payment_succeeded:', invoice.id);

        if (!invoice.subscription) {
            console.log('Invoice is not for a subscription, skipping...');
            return;
        }

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(invoice.subscription as string);
        if (!subscription) {
            console.error('❌ Subscription not found for invoice:', invoice.subscription);
            return;
        }

        // Update payment intent if this is the first payment
        if (!subscription.stripePaymentIntentId && invoice.payment_intent) {
            subscription.stripePaymentIntentId = invoice.payment_intent as string;
            subscription.updatedAt = new Date();
            await this.subscriptionRepository.update(subscription);
            console.log('✅ Payment intent linked to subscription');
        }

        // Log successful payment
        console.log(`✅ Payment successful for subscription ${subscription.id}`);
    }

    private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
        console.log('❌ Processing invoice.payment_failed:', invoice.id);

        if (!invoice.subscription) {
            return;
        }

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(invoice.subscription as string);
        if (!subscription) {
            console.error('❌ Subscription not found for invoice:', invoice.subscription);
            return;
        }

        // Update subscription status
        subscription.status = 'past_due';
        subscription.updatedAt = new Date();
        await this.subscriptionRepository.update(subscription);

        console.log(`⚠️ Payment failed for subscription ${subscription.id}`);

        // TODO: Send email notification to user about payment failure
    }

    private async handleTrialWillEnd(stripeSubscription: Stripe.Subscription): Promise<void> {
        console.log('⏰ Processing customer.subscription.trial_will_end:', stripeSubscription.id);

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.id);
        if (!subscription) {
            console.error('❌ Subscription not found:', stripeSubscription.id);
            return;
        }

        // TODO: Send email notification to user about trial ending
        console.log(`📧 Trial ending soon for subscription ${subscription.id}`);
    }

    private extractPlanFromSubscription(stripeSubscription: Stripe.Subscription): SubscriptionPlan {
        const priceId = stripeSubscription.items.data[0]?.price.id;
        const interval = stripeSubscription.items.data[0]?.price.recurring?.interval;

        // Map your Stripe price IDs to subscription plans
        // You should store these in environment variables
        const priceMappings: Record<string, SubscriptionPlan> = {
            [process.env.STRIPE_MONTHLY_PRICE_ID || '']: 'monthly',
            [process.env.STRIPE_YEARLY_PRICE_ID || '']: 'yearly',
            [process.env.STRIPE_ONE_TIME_PRICE_ID || '']: 'one-time',
            [process.env.STRIPE_MONTHLY_DISCOUNT_PRICE_ID || '']: 'monthly',
            [process.env.STRIPE_YEARLY_DISCOUNT_PRICE_ID || '']: 'yearly',
        };

        // Try to get plan from price ID mapping
        if (priceId && priceMappings[priceId]) {
            return priceMappings[priceId];
        }

        // Fallback to interval-based detection
        if (interval === 'month') {
            return 'monthly';
        } else if (interval === 'year') {
            return 'yearly';
        }

        // Default to monthly if unable to determine
        console.warn(`Unable to determine plan for price ID: ${priceId}`);
        return 'monthly';
    }

    private mapStripeStatusToSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
        const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
            'active': 'active',
            'canceled': 'canceled',
            'incomplete': 'unpaid',
            'incomplete_expired': 'canceled',
            'past_due': 'past_due',
            'trialing': 'trialing',
            'unpaid': 'unpaid',
            'paused': 'canceled', // Map paused to canceled since we don't have a paused status
        };

        return statusMap[stripeStatus] || 'canceled';
    }

    private generateSubscriptionId(): string {
        return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}