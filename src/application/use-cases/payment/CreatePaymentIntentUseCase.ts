import { PaymentService } from '../../../infrastructure/services/PaymentService';

export interface CreatePaymentIntentRequest {
    amount?: number;
    currency?: string;
    email?: string;
}

export interface CreatePaymentIntentResponse {
    clientSecret: string;
    amount: number;
    currency: string;
}

export class CreatePaymentIntentUseCase {
    constructor(private paymentService: PaymentService) { }

    async execute(request: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
        const { amount = 5000, currency = 'usd', email } = request;

        const metadata: any = {
            description: 'Thrive in Japan LMS Access'
        };

        if (email) {
            metadata.email = email;
        }

        const paymentIntent = await this.paymentService.createPaymentIntent(amount, currency, metadata);

        return {
            clientSecret: paymentIntent.clientSecret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
        };
    }
}