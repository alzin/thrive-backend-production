import { HandleSubscriptionWebhookUseCase } from '../subscription/HandleSubscriptionWebhookUseCase';
import { SubscriptionRepository } from '../../../infrastructure/database/repositories/SubscriptionRepository';
import { UserRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { PaymentService } from '../../../infrastructure/services/PaymentService';

export interface HandleWebhookRequest {
    rawBody: any;
    signature: string;
}

export class HandleWebhookUseCase {
    constructor(
        private paymentService: PaymentService,
        private subscriptionRepository: SubscriptionRepository,
        private userRepository: UserRepository
    ) { }

    async execute(request: HandleWebhookRequest): Promise<void> {
        const { rawBody, signature } = request;

        const event = this.paymentService.constructWebhookEvent(rawBody, signature);
        console.log(`📍 Webhook received: ${event.type}`);

        // Initialize the subscription webhook handler
        const subscriptionWebhookHandler = new HandleSubscriptionWebhookUseCase(
            this.subscriptionRepository,
            this.userRepository,
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
            return;
        }

    }

}