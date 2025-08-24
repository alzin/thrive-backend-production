import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { RecentActivityRepository } from '../../database/repositories/RecentActivityRepository';
import { ActivityType } from '../../../domain/entities/RecentActivity';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';

export class ActivityController {
    private activityRepository: RecentActivityRepository;
    private userRepository: UserRepository;
    private profileRepository: ProfileRepository;

    constructor() {
        this.activityRepository = new RecentActivityRepository();
        this.userRepository = new UserRepository();
        this.profileRepository = new ProfileRepository();
    }

    async getUserActivities(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page = 1, limit = 20, startDate, endDate, types } = req.query;
            const userId = req.params.userId || req.user!.userId;

            // Parse activity types if provided
            const activityTypes = types
                ? (types as string).split(',').filter(t => Object.values(ActivityType).includes(t as ActivityType)) as ActivityType[]
                : undefined;

            const filters = {
                userId,
                activityTypes,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
            };

            const result = await this.activityRepository.findWithFilters(
                filters,
                Number(page),
                Number(limit)
            );

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getGlobalActivities(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { limit = 50 } = req.query;

            const activities = await this.activityRepository.findGlobalRecent(Number(limit));

            // Enhance with user information
            const enhancedActivities = await Promise.all(
                activities.map(async (activity) => {
                    const user = await this.userRepository.findById(activity.userId);
                    const profile = await this.profileRepository.findByUserId(activity.userId);

                    return {
                        ...activity,
                        user: {
                            id: user?.id,
                            email: user?.email,
                            name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
                            profilePhoto: profile?.profilePhoto,
                            level: profile?.level || 1,
                        },
                    };
                })
            );

            res.json({ activities: enhancedActivities });
        } catch (error) {
            next(error);
        }
    }

    async getMyRecentActivities(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { limit = 10 } = req.query;

            const activities = await this.activityRepository.findByUserId(
                req.user!.userId,
                Number(limit)
            );

            res.json({ activities });
        } catch (error) {
            next(error);
        }
    }
}