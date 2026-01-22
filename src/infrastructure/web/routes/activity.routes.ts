import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const activityRouter = (activityController: ActivityController): Router => {
    const router = Router();

    router.use(authenticate);

    router.get('/my-activities', activityController.getMyRecentActivities.bind(activityController));
    router.get('/user', activityController.getUserActivities.bind(activityController));
    router.get('/user/:userId', activityController.getUserActivities.bind(activityController));
    router.get('/global', authorize('ADMIN'), activityController.getGlobalActivities.bind(activityController));

    return router;
};

export default activityRouter;