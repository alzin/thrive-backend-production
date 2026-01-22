import { RecentActivityRepository } from "../../../infrastructure/database/repositories/RecentActivityRepository";

export class GetMyRecentActivitiesUseCase {
    constructor(
        private readonly activityRepository: RecentActivityRepository
    ) { }

    async execute(userId: string, limit: number = 10) {
        const activities = await this.activityRepository.findByUserId(userId, limit);
        return { activities };
    }
}