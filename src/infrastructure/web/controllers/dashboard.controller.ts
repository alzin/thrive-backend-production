// backend/src/infrastructure/web/controllers/dashboard.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GetDashboardDataUseCase } from '../../../application/use-cases/dashboard/GetDashboardDataUseCase';

export class DashboardController {
    constructor(
        private getDashboardDataUseCase: GetDashboardDataUseCase,
    ) { }

    async getDashboardData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {

            const dashboardData = await this.getDashboardDataUseCase.execute({
                userId: req.user!.userId,
            });

            res.json(dashboardData);
        } catch (error) {
            next(error);
        }
    }
}