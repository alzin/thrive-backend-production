// backend/src/infrastructure/web/routes/subscription.routes.ts
import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const subscriptionRouter = (subscriptionController: SubscriptionController): Router => {
    const router = Router();

    router.use(authenticate);

    router.get('/check', subscriptionController.checkSubscription.bind(subscriptionController));

    return router;
};

export default subscriptionRouter;




