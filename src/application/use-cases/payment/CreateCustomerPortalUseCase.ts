import { ENV_CONFIG } from "../../../infrastructure/config/env.config";
import { SubscriptionRepository } from "../../../infrastructure/database/repositories/SubscriptionRepository";
import { PaymentService } from "../../../infrastructure/services/PaymentService";

export interface CreateCustomerPortalRequest {
    userId: string;
}

export interface CreateCustomerPortalResponse {
    session: any;
}

export class CreateCustomerPortalUseCase {
    constructor(
        private paymentService: PaymentService,
        private subscriptionRepository: SubscriptionRepository
    ) { }

    async execute(request: CreateCustomerPortalRequest): Promise<CreateCustomerPortalResponse> {
        const { userId } = request;

        const subscription = await this.subscriptionRepository.findByUserId(userId);

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const stripeCustomerId = subscription.stripeCustomerId;

        if (!stripeCustomerId) {
            throw new Error('stripeCustomerId Not Found');
        }

        const session = await this.paymentService.createCustomerPortalSession(
            stripeCustomerId,
            `${ENV_CONFIG.FRONTEND_URL}/dashboard`
        );

        if (!session) {
            throw new Error('Failed to createCustomerPortalSession');
        }

        return { session };
    }
}