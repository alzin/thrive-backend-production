// backend/src/infrastructure/web/routes/admin.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const adminRouter = (adminController: AdminController): Router => {
  const router = Router();

  // All admin routes require authentication and admin role
  router.use(authenticate, authorize('ADMIN'));

  // User management
  router.get('/users', adminController.getUsers.bind(adminController));
  router.put('/users/:userId/status', adminController.updateUserStatus.bind(adminController));
  router.post(
    '/users/:userId/points',
    [
      body('points').isInt(),
      body('reason').notEmpty()
    ],
    validateRequest,
    adminController.adjustUserPoints.bind(adminController)
  );

  // Content management
  router.get('/posts/flagged', adminController.getFlaggedPosts.bind(adminController));
  router.delete('/posts/:postId', adminController.deletePost.bind(adminController));
  router.post('/posts/:postId/unflag', adminController.unflagPost.bind(adminController));

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
    adminController.createCourse.bind(adminController)
  );
  router.put('/courses/:courseId', adminController.updateCourse.bind(adminController));
  router.delete('/courses/:courseId', adminController.deleteCourse.bind(adminController));

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
    adminController.createLesson.bind(adminController)
  );
  router.put('/lessons/:lessonId', adminController.updateLesson.bind(adminController));
  router.delete('/lessons/:lessonId', adminController.deleteLesson.bind(adminController));
  router.get('/lessons/:lessonId', adminController.getLessonWithKeywords.bind(adminController));

  // Session management
  router.post(
    '/sessions',
    [
      body('title').notEmpty(),
      body('description').notEmpty(),
      body('type').isIn(['SPEAKING', 'EVENT', 'STANDARD']),
      body('scheduledAt').isISO8601(),
      body('duration').isInt({ min: 15 }),
      body('maxParticipants').isInt({ min: 1 }),
      body('isRecurring').optional().isBoolean(),
      body('recurringWeeks').optional().isInt({ min: 2, max: 52 })
    ],
    validateRequest,
    adminController.createSession.bind(adminController)
  );
  router.put('/sessions/:sessionId', adminController.updateSession.bind(adminController));

  // UPDATED: Enhanced session deletion with delete options
  router.get('/sessions/:sessionId/delete-options', adminController.getDeleteOptions.bind(adminController));
  router.delete(
    '/sessions/:sessionId',
    [
      body('deleteOption').isIn(['single', 'promote', 'deleteAll', 'child'])
    ],
    validateRequest,
    adminController.deleteSession.bind(adminController)
  );

  // Paginated sessions endpoint
  router.get('/sessions/paginated', adminController.getSessionsWithPagination.bind(adminController));

  // Recurring session details
  router.get('/sessions/:sessionId/recurring-details', adminController.getRecurringSessionDetails.bind(adminController));

  // Analytics
  router.get('/analytics/overview', adminController.getAnalyticsOverview.bind(adminController));
  router.get('/analytics/revenue', adminController.getRevenueAnalytics.bind(adminController));
  router.get('/analytics/engagement', adminController.getEngagementAnalytics.bind(adminController));

  // Announcements
  router.post(
    '/announcements',
    [
      body('content').notEmpty().trim()
    ],
    validateRequest,
    adminController.createAnnouncement.bind(adminController)
  );



  return router;
};

export default adminRouter;

