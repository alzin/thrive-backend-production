// backend/src/infrastructure/web/routes/subscription.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const subscriptionRouter = (subscriptionController: SubscriptionController): Router => {
    const router = Router();

    router.use(authenticate);

    router.get('/check', subscriptionController.checkSubscription.bind(subscriptionController));
    router.post(
        '/trial-alternative-time',
        [
            body('preferredTimes')
                .isArray({ min: 1 })
                .withMessage('At least one preferred time is required'),
            body('preferredTimes.*')
                .isISO8601()
                .withMessage('Each preferred time must be a valid ISO date-time string'),
            body('timeZone')
                .isString()
                .trim()
                .notEmpty()
                .withMessage('Time zone is required'),
        ],
        validateRequest,
        subscriptionController.submitTrialAlternativeTime.bind(subscriptionController)
    );

    return router;
};

export default subscriptionRouter;




