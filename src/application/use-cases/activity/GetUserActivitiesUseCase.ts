import { RecentActivityRepository } from "../../../infrastructure/database/repositories/RecentActivityRepository";
import { ActivityType } from "../../../domain/entities/RecentActivity";

interface GetUserActivitiesFilters {
    userId: string;
    activityTypes?: ActivityType[];
    startDate?: Date;
    endDate?: Date;
}

export class GetUserActivitiesUseCase {
    constructor(
        private readonly activityRepository: RecentActivityRepository
    ) { }

    async execute(
        filters: GetUserActivitiesFilters,
        page: number = 1,
        limit: number = 20
    ) {
        return await this.activityRepository.findWithFilters(
            filters,
            page,
            limit
        );
    }
}