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
    currentPlan: string | null;
    isTrialing: boolean;
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
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new Error('User not found');
        }

        const subscription = await this.subscriptionRepository.findByUserId(dto.userId);
        const activeSubscription = await this.subscriptionRepository.findActiveByUserId(dto.userId);

        const hasSubscription = user.role === 'ADMIN' ? true : subscription !== null;
        const hasAccessToCourses = user.role === 'ADMIN' ? true : activeSubscription !== null;

        const status = user.role === 'ADMIN' ? 'active' : subscription ? subscription.status : null;

        const currentPlan = user.role === 'ADMIN' ? 'premium' : subscription ? subscription.subscriptionPlan : null;

        const isTrialing = subscription?.status === 'trialing';

        return {
            hasSubscription,
            hasAccessToCourses,
            status,
            currentPlan,
            isTrialing,
            subscription: subscription
                ? {
                    id: subscription.id,
                    plan: subscription.subscriptionPlan,
                    status: subscription.status,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                }
                : null,
        };
    }
}