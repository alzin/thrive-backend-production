// backend/src/infrastructure/web/routes/admin.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.post(
  '/users/:userId/points',
  [
    body('points').isInt(),
    body('reason').notEmpty()
  ],
  validateRequest,
  adminController.adjustUserPoints
);

// Content management
router.get('/posts/flagged', adminController.getFlaggedPosts);
router.delete('/posts/:postId', adminController.deletePost);
router.post('/posts/:postId/unflag', adminController.unflagPost);

// Course management
router.post(
  '/courses',
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('type').isIn(['JAPAN_IN_CONTEXT', 'JLPT_IN_CONTEXT']),
    body('icon').notEmpty()
  ],
  validateRequest,
  adminController.createCourse
);
router.put('/courses/:courseId', adminController.updateCourse);
router.delete('/courses/:courseId', adminController.deleteCourse);

// Lesson management
router.post(
  '/courses/:courseId/lessons',
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('order').isInt({ min: 1 }),
    body('pointsReward').isInt({ min: 0 })
  ],
  validateRequest,
  adminController.createLesson
);
router.put('/lessons/:lessonId', adminController.updateLesson);
router.delete('/lessons/:lessonId', adminController.deleteLesson);
router.get('/lessons/:lessonId', adminController.getLessonWithKeywords);

// Session management
router.post(
  '/sessions',
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('type').isIn(['SPEAKING', 'EVENT']),
    body('scheduledAt').isISO8601(),
    body('duration').isInt({ min: 15 }),
    body('maxParticipants').isInt({ min: 1 }),
    body('isRecurring').optional().isBoolean(),
    body('recurringWeeks').optional().isInt({ min: 2, max: 52 })
  ],
  validateRequest,
  adminController.createSession
);
router.put('/sessions/:sessionId', adminController.updateSession);

// UPDATED: Enhanced session deletion with delete options
router.get('/sessions/:sessionId/delete-options', adminController.getDeleteOptions);
router.delete(
  '/sessions/:sessionId',
  [
    body('deleteOption').isIn(['single', 'promote', 'deleteAll', 'child'])
  ],
  validateRequest,
  adminController.deleteSession
);

// Paginated sessions endpoint
router.get('/sessions/paginated', adminController.getSessionsWithPagination);

// Recurring session details
router.get('/sessions/:sessionId/recurring-details', adminController.getRecurringSessionDetails);

// Analytics
router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/engagement', adminController.getEngagementAnalytics);

// Announcements
router.post(
  '/announcements',
  [
    body('content').notEmpty().trim()
  ],
  validateRequest,
  adminController.createAnnouncement
);

export { router as adminRouter };