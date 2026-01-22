import { PaymentService } from "../../../infrastructure/services/PaymentService";

export interface VerifyCheckoutSessionRequest {
    sessionId: string;
}

export interface VerifyCheckoutSessionResponse {
    status: string;
    paymentIntentId: any;
    metadata: any;
    transactionDetails: {
        transactionId: string;
        name: string;
        value: number;
        currency: string;
        plan: string;
        subscriptionId: string;
        customerId: string;
        isTrial: boolean;
        interval: string;
    };
}

export class VerifyCheckoutSessionUseCase {
    constructor(private paymentService: PaymentService) { }

    async execute(request: VerifyCheckoutSessionRequest): Promise<VerifyCheckoutSessionResponse> {
        const { sessionId } = request;

        const session = await this.paymentService.retrieveCheckoutSession(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        const planType = session.metadata?.planType || 'unknown_plan';
        const planName = `Thrive ${planType.charAt(0).toUpperCase() + planType.slice(1)} Subscription`;
        const isTrial = session.total_details?.amount_tax === 0 && session.amount_total === 0;

        let finalValue = session.amount_total || 0;

        if (finalValue === 0) {
            if (session.line_items?.data?.[0]?.price?.unit_amount) {
                finalValue = session.line_items.data[0].price.unit_amount;
            }
        }

        return {
            status: session.payment_status,
            paymentIntentId: session.payment_intent,
            metadata: session.metadata,
            transactionDetails: {
                transactionId: session.id,
                name: planName,
                value: finalValue,
                currency: session.currency?.toUpperCase() || 'JPY',
                plan: planType,
                subscriptionId: session.subscription as string || 'sub_pending',
                customerId: session.customer as string || 'cus_guest',
                isTrial: isTrial,
                interval: session.metadata?.interval || 'monthly'
            }
        };
    }
}