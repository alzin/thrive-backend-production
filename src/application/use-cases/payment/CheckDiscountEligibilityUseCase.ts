import { ENV_CONFIG } from "../../../infrastructure/config/env.config";
import { SubscriptionRepository } from "../../../infrastructure/database/repositories/SubscriptionRepository";

export interface CheckDiscountEligibilityResponse {
    isEligible: boolean;
    remainingSpots: number;
    totalUsed: number;
    limit: number;
}

export class CheckDiscountEligibilityUseCase {
    private readonly DISCOUNT_LIMIT = Number(ENV_CONFIG.STRIPE_DISCOUNT_LIMIT_USERS);

    constructor(private subscriptionRepository: SubscriptionRepository) { }

    async execute(): Promise<CheckDiscountEligibilityResponse> {
        const { isEligible, remainingSpots, totalUsed } = await this.getDiscountStatus();

        return {
            isEligible,
            remainingSpots,
            totalUsed,
            limit: this.DISCOUNT_LIMIT
        };
    }

    private async getDiscountStatus(): Promise<{ isEligible: boolean; remainingSpots: number; totalUsed: number }> {
        const allPayments = await this.subscriptionRepository.getAllAcivePayment();
        const totalUsed = allPayments.length;
        const remainingSpots = Math.max(0, this.DISCOUNT_LIMIT - totalUsed);
        const isEligible = totalUsed < this.DISCOUNT_LIMIT;

        return { isEligible, remainingSpots, totalUsed };
    }
}