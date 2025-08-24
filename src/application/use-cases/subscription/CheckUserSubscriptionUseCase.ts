// backend/src/application/use-cases/subscription/CheckUserSubscriptionUseCase.ts
import { ISubscriptionRepository } from '../../../domain/repositories/ISubscriptionRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export interface CheckUserSubscriptionDTO {
    userId: string;
}

export interface SubscriptionStatusResponse {
    hasSubscription: boolean;
    hasAccessToCourses: boolean;
    status: string | null;
    subscription: {
        id: string;
        plan: string;
        status: string;
        currentPeriodEnd: Date;
    } | null;
}

export class CheckUserSubscriptionUseCase {
    constructor(
        private subscriptionRepository: ISubscriptionRepository,
        private userRepository: IUserRepository
    ) { }

    async execute(dto: CheckUserSubscriptionDTO): Promise<SubscriptionStatusResponse> {
        // Verify user exists
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get the user's subscription (one-to-one relationship)
        const subscription = await this.subscriptionRepository.findByUserId(dto.userId);
        const acccessSubscription = await this.subscriptionRepository.findActiveByUserId(dto.userId);


        console.log('User subscription:', subscription);

        // Check if user has an active subscription
        const hasSubscription = user.role === "ADMIN" ? true : subscription !== null;
        const hasAccessToCourses = user.role === "ADMIN" ? true : acccessSubscription !== null;

        const status = user.role === "ADMIN" ? "active" :
            (subscription ? subscription.status : null);

        return {
            hasSubscription,
            hasAccessToCourses,
            status,
            subscription: subscription ? {
                id: subscription.id,
                plan: subscription.subscriptionPlan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd
            } : null,
        };
    }
}