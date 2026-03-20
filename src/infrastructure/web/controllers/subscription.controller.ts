import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { CheckUserSubscriptionUseCase } from '../../../application/use-cases/subscription/CheckUserSubscriptionUseCase';
import { SubmitTrialAlternativeTimeRequestUseCase } from '../../../application/use-cases/subscription/SubmitTrialAlternativeTimeRequestUseCase';

export class SubscriptionController {
    constructor(
        private checkUserSubscriptionUseCase: CheckUserSubscriptionUseCase,
        private submitTrialAlternativeTimeRequestUseCase: SubmitTrialAlternativeTimeRequestUseCase
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

    async submitTrialAlternativeTime(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { preferredTimes, timeZone } = req.body;

            const result = await this.submitTrialAlternativeTimeRequestUseCase.execute({
                userId: req.user!.userId,
                preferredTimes,
                timeZone,
            });

            res.status(201).json({
                success: true,
                data: result,
                message: 'Alternative times submitted successfully',
            });
        } catch (error) {
            if (error instanceof Error && (
                error.message === 'At least one preferred time is required' ||
                error.message === 'Time zone is required' ||
                error.message === 'Each preferred time must be a valid ISO date-time string'
            )) {
                res.status(400).json({ error: error.message });
                return;
            }
            next(error);
        }
    }
}