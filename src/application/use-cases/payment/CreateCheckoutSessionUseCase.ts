// backend/src/application/use-cases/payment/CreateCheckoutSessionUseCase.ts
import { ENV_CONFIG } from '../../../infrastructure/config/env.config';
import { SubscriptionRepository } from '../../../infrastructure/database/repositories/SubscriptionRepository';
import { PaymentService } from '../../../infrastructure/services/PaymentService';

export interface CreateCheckoutSessionRequest {
    mode?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: any;
    planType?: string;
    email: string;
    userId: string;
}

export interface CreateCheckoutSessionResponse {
    sessionId?: string;
    isDiscounted: boolean;
    isUpgrade?: boolean;
    isDowngrade?: boolean;
    upgraded?: boolean;
    isPaidNow?: boolean;
    message?: string;
}

export class CreateCheckoutSessionUseCase {
    private readonly DISCOUNT_LIMIT = Number(ENV_CONFIG.STRIPE_DISCOUNT_LIMIT_USERS);
    private readonly DISCOUNT_PRICES = {
        monthly: {
            regular: ENV_CONFIG.STRIPE_MONTHLY_PRICE_ID || '',
            discounted: ENV_CONFIG.STRIPE_MONTHLY_DISCOUNT_PRICE_ID || ''
        },
        yearly: {
            regular: ENV_CONFIG.STRIPE_YEARLY_PRICE_ID || '',
            discounted: ENV_CONFIG.STRIPE_YEARLY_DISCOUNT_PRICE_ID || ''
        },
        monthlySpecial: {
            regular: ENV_CONFIG.STRIPE_MONTHLY_PRICE_ID_SPECIAL || '',
            discounted: ENV_CONFIG.STRIPE_MONTHLY_PRICE_ID_SPECIAL || ''
        },
        standard: {
            regular: ENV_CONFIG.STRIPE_STANDARD_PRICE_ID || '',
            discounted: ENV_CONFIG.STRIPE_STANDARD_DISCOUNT_PRICE_ID || ''
        },
        premium: {
            regular: ENV_CONFIG.STRIPE_PREMIUM_PRICE_ID || '',
            discounted: ENV_CONFIG.STRIPE_PREMIUM_DISCOUNT_PRICE_ID || '',
        },
    };

    // Define plan hierarchy for upgrade/downgrade logic
    private readonly PLAN_HIERARCHY: Record<string, number> = {
        standard: 1,
        premium: 2,
    };

    constructor(
        private paymentService: PaymentService,
        private subscriptionRepository: SubscriptionRepository
    ) { }

    async execute(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
        const { mode = 'subscription', successUrl, cancelUrl, metadata, planType, email, userId } = request;

        // Validate planType
        if (!planType) {
            throw new Error('planType is required');
        }

        const validPlanTypes = Object.keys(this.DISCOUNT_PRICES);
        if (!validPlanTypes.includes(planType)) {
            throw new Error(`Invalid planType. Must be one of: ${validPlanTypes.join(', ')}`);
        }

        // Check for existing subscription
        const existingSubscription = await this.subscriptionRepository.findByUserId(userId);

        // ========== EXISTING SUBSCRIPTION LOGIC ==========
        if (
            existingSubscription &&
            existingSubscription.stripeSubscriptionId &&
            existingSubscription.stripeCustomerId &&
            ['active', 'trialing'].includes(existingSubscription.status)
        ) {
            const currentPlan = existingSubscription.subscriptionPlan;
            const isTrialing = existingSubscription.status === 'trialing';
            const isSamePlan = currentPlan === planType;

            // SCENARIO 1: Same plan + Trialing → "Pay Now" (end trial and activate)
            if (isSamePlan && isTrialing) {
                return await this.handlePayNow({
                    existingSubscription,
                    userId,
                });
            }

            // SCENARIO 2: Same plan + Active → Error (already subscribed)
            if (isSamePlan && !isTrialing) {
                throw new Error(`You are already actively subscribed to the ${planType} plan.`);
            }

            // SCENARIO 3: Different plan → Upgrade or Downgrade
            const currentHierarchy = this.PLAN_HIERARCHY[currentPlan] || 0;
            const newHierarchy = this.PLAN_HIERARCHY[planType] || 0;

            if (newHierarchy > currentHierarchy) {
                // UPGRADE
                return await this.handlePlanChange({
                    existingSubscription,
                    newPlanType: planType,
                    successUrl,
                    cancelUrl,
                    metadata,
                    userId,
                    isUpgrade: true,
                });
            } else {
                // DOWNGRADE
                return await this.handlePlanChange({
                    existingSubscription,
                    newPlanType: planType,
                    successUrl,
                    cancelUrl,
                    metadata,
                    userId,
                    isUpgrade: false,
                });
            }
        }

        // ========== NEW SUBSCRIPTION LOGIC ==========
        const { isEligible } = await this.getDiscountStatus();

        let finalPriceId = '';
        if (isEligible && this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES]) {
            finalPriceId = this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES].discounted;
        } else if (this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES]) {
            finalPriceId = this.DISCOUNT_PRICES[planType as keyof typeof this.DISCOUNT_PRICES].regular;
        }

        if (!finalPriceId) {
            throw new Error(`Price ID for plan "${planType}" is not configured.`);
        }

        const sessionData = {
            priceId: finalPriceId,
            mode: mode as 'payment' | 'subscription',
            successUrl,
            cancelUrl,
            metadata: {
                ...metadata,
                email,
                userId,
                isDiscounted: isEligible ? 'true' : 'false',
                planType: planType || 'unknown',
            },
            customerId: existingSubscription?.stripeCustomerId || null,
        };

        const session = await this.paymentService.createCheckoutSession(sessionData);

        return {
            sessionId: session.id,
            isDiscounted: isEligible,
            isUpgrade: false,
            isDowngrade: false,
        };
    }

    /**
     * Handle "Pay Now" - End trial and activate subscription immediately
     */
    private async handlePayNow(params: {
        existingSubscription: any;
        userId: string;
    }): Promise<CreateCheckoutSessionResponse> {
        const { existingSubscription } = params;

        try {
            const updatedSubscription = await this.paymentService.cancelTrialAndActivatePayment(
                existingSubscription.stripeSubscriptionId
            );

            if (!updatedSubscription) {
                throw new Error('Failed to activate subscription');
            }

            return {
                isDiscounted: false,
                isUpgrade: false,
                isDowngrade: false,
                isPaidNow: true,
                upgraded: true,
                message: 'Your subscription is now active! Billing has started.',
            };
        } catch (error: any) {
            throw new Error(`Failed to activate subscription: ${error.message}`);
        }
    }

    /**
     * Handle plan change (upgrade or downgrade)
     */
    private async handlePlanChange(params: {
        existingSubscription: any;
        newPlanType: string;
        successUrl: string;
        cancelUrl: string;
        metadata?: any;
        userId: string;
        isUpgrade: boolean;
    }): Promise<CreateCheckoutSessionResponse> {
        const { existingSubscription, newPlanType, successUrl, cancelUrl, metadata, userId, isUpgrade } =
            params;

        const { isEligible } = await this.getDiscountStatus();

        let newPriceId = '';
        if (isEligible && this.DISCOUNT_PRICES[newPlanType as keyof typeof this.DISCOUNT_PRICES]) {
            newPriceId = this.DISCOUNT_PRICES[newPlanType as keyof typeof this.DISCOUNT_PRICES].discounted;
        } else if (this.DISCOUNT_PRICES[newPlanType as keyof typeof this.DISCOUNT_PRICES]) {
            newPriceId = this.DISCOUNT_PRICES[newPlanType as keyof typeof this.DISCOUNT_PRICES].regular;
        }

        if (!newPriceId) {
            throw new Error(`Price ID for plan "${newPlanType}" is not configured.`);
        }

        // Check if customer has a valid payment method
        const hasPaymentMethod = await this.paymentService.hasValidPaymentMethod(
            existingSubscription.stripeCustomerId
        );

        // If on trial OR has payment method, do direct plan change
        if (hasPaymentMethod || existingSubscription.status === 'trialing') {
            try {
                const updatedSubscription = await this.paymentService.upgradeSubscription({
                    subscriptionId: existingSubscription.stripeSubscriptionId,
                    newPriceId: newPriceId,
                    prorationBehavior: 'create_prorations',
                });

                const actionWord = isUpgrade ? 'upgraded' : 'downgraded';
                const trialMessage = existingSubscription.status === 'trialing'
                    ? 'Your trial has ended and billing begins now.'
                    : isUpgrade
                        ? 'Your account has been prorated.'
                        : 'You will receive a prorated credit.';

                return {
                    isDiscounted: false,
                    isUpgrade,
                    isDowngrade: !isUpgrade,
                    upgraded: true,
                    message: `Successfully ${actionWord} to ${newPlanType}! ${trialMessage}`,
                };
            } catch (error: any) {
                console.error('Direct plan change failed:', error.message);
                // Fall through to checkout session creation
            }
        }

        // If no payment method or direct change failed, create checkout session
        const session = await this.paymentService.createUpgradeCheckoutSession({
            customerId: existingSubscription.stripeCustomerId,
            subscriptionId: existingSubscription.stripeSubscriptionId,
            newPriceId: newPriceId,
            successUrl,
            cancelUrl,
            metadata: {
                ...metadata,
                userId,
                newPlanType,
                isUpgrade: isUpgrade ? 'true' : 'false',
                isDowngrade: !isUpgrade ? 'true' : 'false',
                previousPlan: existingSubscription.subscriptionPlan,
                previousSubscriptionId: existingSubscription.stripeSubscriptionId,
            },
        });

        return {
            sessionId: session.id,
            isDiscounted: false,
            isUpgrade,
            isDowngrade: !isUpgrade,
            upgraded: false,
            message: 'Payment method required. Please complete checkout.',
        };
    }

    private async getDiscountStatus(): Promise<{
        isEligible: boolean;
        remainingSpots: number;
        totalUsed: number;
    }> {
        const allPayments = await this.subscriptionRepository.getAllAcivePayment();
        const totalUsed = allPayments.length;
        const remainingSpots = Math.max(0, this.DISCOUNT_LIMIT - totalUsed);
        const isEligible = totalUsed < this.DISCOUNT_LIMIT;

        return { isEligible, remainingSpots, totalUsed };
    }
}