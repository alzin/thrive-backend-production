// backend/src/infrastructure/web/controllers/subscription.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SubscriptionRepository } from '../../database/repositories/SubscriptionRepository';
import { CheckUserSubscriptionUseCase } from '../../../application/use-cases/subscription/CheckUserSubscriptionUseCase';
import { UserRepository } from '../../database/repositories/UserRepository';

export class SubscriptionController {
    async checkSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const checkSubscriptionUseCase = new CheckUserSubscriptionUseCase(
                new SubscriptionRepository(),
                new UserRepository()
            );

            const status = await checkSubscriptionUseCase.execute({
                userId: req.user!.userId,
            });

            res.json(status);
        } catch (error) {
            next(error);
        }
    }
}