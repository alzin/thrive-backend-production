import { RecentActivity, ActivityType } from '../entities/RecentActivity';

export interface RecentActivityFilters {
    userId?: string;
    activityTypes?: ActivityType[];
    startDate?: Date;
    endDate?: Date;
}

export interface PaginatedActivities {
    activities: RecentActivity[];
    total: number;
    page: number;
    totalPages: number;
}

export interface IRecentActivityRepository {
    create(activity: RecentActivity): Promise<RecentActivity>;
    createMany(activities: RecentActivity[]): Promise<RecentActivity[]>;
    findById(id: string): Promise<RecentActivity | null>;
    findByUserId(userId: string, limit?: number): Promise<RecentActivity[]>;
    findWithFilters(
        filters: RecentActivityFilters,
        page: number,
        limit: number
    ): Promise<PaginatedActivities>;
    findGlobalRecent(limit: number): Promise<RecentActivity[]>;
    deleteOlderThan(date: Date): Promise<number>;
}