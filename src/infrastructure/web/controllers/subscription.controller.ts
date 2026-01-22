import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { CheckUserSubscriptionUseCase } from '../../../application/use-cases/subscription/CheckUserSubscriptionUseCase';

export class SubscriptionController {
    constructor(
        private checkUserSubscriptionUseCase: CheckUserSubscriptionUseCase
    ) { }

    async checkSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {

            const status = await this.checkUserSubscriptionUseCase.execute({
                userId: req.user!.userId,
            });

            res.json(status);
        } catch (error) {
            next(error);
        }
    }
}