// backend/src/infrastructure/web/routes/announcement.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const announcementRouter = (announcementController: AnnouncementController): Router => {
  const router = Router();

  // Apply authentication to all announcement routes
  router.use(authenticate);

  // Announcement CRUD routes
  router.post(
    '/',
    [
      body('content').notEmpty().trim().withMessage('Content is required')
    ],
    validateRequest,
    announcementController.createAnnouncement.bind(announcementController)
  );

  router.get('/', announcementController.getAnnouncements.bind(announcementController));

  router.get('/:announcementId', announcementController.getAnnouncementById.bind(announcementController));

  router.post('/:announcementId/toggle-like', announcementController.toggleLike.bind(announcementController));

  router.put(
    '/:announcementId',
    [
      body('content').notEmpty().trim().withMessage('Content is required')
    ],
    validateRequest,
    announcementController.editAnnouncement.bind(announcementController)
  );

  router.delete('/:announcementId', announcementController.deleteAnnouncement.bind(announcementController));

  // Comment routes for announcements
  router.get('/:announcementId/comments', announcementController.getCommentsByAnnouncement.bind(announcementController));

  router.get('/:announcementId/comments/count', announcementController.getCommentCount.bind(announcementController));

  router.post(
    '/:announcementId/comments',
    [
      body('content')
        .notEmpty()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment content must be between 1 and 1000 characters'),
      body('parentCommentId')
        .optional()
        .isString()
        .withMessage('Parent comment ID must be a string')
    ],
    validateRequest,
    announcementController.createComment.bind(announcementController)
  );

  router.delete('/comments/:commentId', announcementController.deleteComment.bind(announcementController));

  // New route for editing a comment on an announcement
  router.put(
    '/comments/:commentId',
    [
      body('content')
        .notEmpty()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment content must be between 1 and 1000 characters'),
    ],
    validateRequest,
    announcementController.updateComment.bind(announcementController)
  );
  return router;
};

export default announcementRouter;