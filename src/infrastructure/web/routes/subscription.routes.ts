// backend/src/infrastructure/web/routes/subscription.routes.ts
import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

router.use(authenticate);

router.get('/check', subscriptionController.checkSubscription);

export { router as subscriptionRouter };