import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const activityController = new ActivityController();

// User routes
router.use(authenticate);

// Get current user's activities
router.get('/my-activities', activityController.getMyRecentActivities.bind(activityController));

// Get any user's activities (with filters)
// router.get('/user/:userId?', activityController.getUserActivities.bind(activityController));
router.get('/user', activityController.getUserActivities.bind(activityController)); // for current user
router.get('/user/:userId', activityController.getUserActivities.bind(activityController)); // for specific user


// Admin route - get global activities
router.get('/global', authorize('ADMIN'), activityController.getGlobalActivities.bind(activityController));

export { router as activityRouter };