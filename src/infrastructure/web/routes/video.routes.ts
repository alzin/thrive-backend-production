// backend/src/infrastructure/web/routes/video.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { VideoController } from '../controllers/video.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { VideoType } from '../../../domain/entities/Video';

const videoRouter = (videoController: VideoController): Router => {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticate);

  // Admin video management routes
  router.post(
    '/',
    [
      // body('title').notEmpty().trim().withMessage('Title is required'),
      body('description').notEmpty().trim().withMessage('Description is required'),
      body('videoUrl').notEmpty().isURL().withMessage('Valid video URL is required'),
      body('videoType').isIn(Object.values(VideoType)).withMessage('Invalid video type'),
      body('thumbnailUrl').optional().isURL().withMessage('Thumbnail URL must be valid'),
      // body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
      body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
    ],
    validateRequest,
    videoController.createOrUpdateVideo.bind(videoController)
  );

  router.get('/', videoController.getVideo.bind(videoController));

  router.delete('/', videoController.deleteVideo.bind(videoController));

  router.get('/exists', videoController.videoExists.bind(videoController));

  // 🎯 FIRST-TIME LOGIN ROUTES - These are the key endpoints for auto-tour
  router.get('/tour', videoController.getTourVideo.bind(videoController));
  router.get('/tour/status', videoController.getTourVideoStatus.bind(videoController));
  router.post('/tour/mark-viewed', videoController.markTourVideoViewed.bind(videoController));

  return router;
};

export default videoRouter;