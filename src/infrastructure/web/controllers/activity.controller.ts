import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ActivityType } from '../../../domain/entities/RecentActivity';

import { GetUserActivitiesUseCase } from '../../../application/use-cases/activity/GetUserActivitiesUseCase';
import { GetGlobalActivitiesUseCase } from '../../../application/use-cases/activity/GetGlobalActivitiesUseCase';
import { GetMyRecentActivitiesUseCase } from '../../../application/use-cases/activity/GetMyRecentActivitiesUseCase';

export class ActivityController {

    constructor(
        private readonly getUserActivitiesUseCase: GetUserActivitiesUseCase,
        private readonly getGlobalActivitiesUseCase: GetGlobalActivitiesUseCase,
        private readonly getMyRecentActivitiesUseCase: GetMyRecentActivitiesUseCase
    ) { }

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

            const result = await this.getUserActivitiesUseCase.execute(
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

            const result = await this.getGlobalActivitiesUseCase.execute(Number(limit));

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getMyRecentActivities(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { limit = 10 } = req.query;

            const result = await this.getMyRecentActivitiesUseCase.execute(
                req.user!.userId,
                Number(limit)
            );

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}