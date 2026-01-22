import { UserRepository } from "../../../../infrastructure/database/repositories/UserRepository";
import { ProfileRepository } from "../../../../infrastructure/database/repositories/ProfileRepository";
import { SubscriptionRepository } from "../../../../infrastructure/database/repositories/SubscriptionRepository";

export class GetUsersUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly subscriptionRepository: SubscriptionRepository,

    ) { }

    async execute(page: number = 1, limit: number = 20) {
        const users = await this.userRepository.findAll();
        const profiles = await this.profileRepository.findAll();
        const subscriptions = await this.subscriptionRepository.findAll();


        const usersWithProfiles = users.map(user => {
            const profile = profiles.find(p => p.userId === user.id);
            const subscription = subscriptions.find(s => s.userId === user.id);
            return {
                ...user,
                profile,
                subscriptionStatus: user.role === "ADMIN" ? "active" : subscription ? subscription.status : "No Subscription"
            };
        });

        return {
            users: usersWithProfiles,
            total: users.length,
            page: page,
            totalPages: Math.ceil(users.length / limit)
        };
    }
}