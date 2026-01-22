import { SubscriptionRepository } from "../../../infrastructure/database/repositories/SubscriptionRepository";
import { PaymentService } from "../../../infrastructure/services/PaymentService";

export interface EndTrialRequest {
    userId: string;
}

export interface EndTrialResponse {
    data: any;
}

export class EndTrialUseCase {
    constructor(
        private paymentService: PaymentService,
        private subscriptionRepository: SubscriptionRepository
    ) { }

    async execute(request: EndTrialRequest): Promise<EndTrialResponse> {
        const { userId } = request;

        const subscription = await this.subscriptionRepository.findByUserId(userId);

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const subscriptionId = subscription.stripeSubscriptionId;

        if (!subscriptionId) {
            throw new Error('subscriptionId Not Found');
        }

        const data = await this.paymentService.cancelTrialAndActivatePayment(subscriptionId);

        if (!data) {
            throw new Error('Failed to cancel trial');
        }

        return { data };
    }
}