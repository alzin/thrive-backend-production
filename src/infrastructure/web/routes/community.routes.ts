import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { CommunityController } from '../controllers/community.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const communityController = new CommunityController();

// Configure multer for media uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10, // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
    }
  },
});

router.use(authenticate);

// Media upload routes
router.post(
  '/upload-media',
  upload.array('media', 10), // Accept up to 10 files with field name 'media'
  communityController.uploadMedia.bind(communityController)
);

router.delete(
  '/delete-media',
  [
    body('mediaUrls')
      .isArray()
      .withMessage('Media URLs must be an array')
      .notEmpty()
      .withMessage('Media URLs array cannot be empty')
  ],
  validateRequest,
  communityController.deleteMedia.bind(communityController)
);

// Post routes
router.post(
  '/posts',
  [
    body('content').notEmpty().trim(),
    body('mediaUrls').optional().isArray(),
    body('isAnnouncement').optional().isBoolean()
  ],
  validateRequest,
  communityController.createPost
);

router.get('/posts', communityController.getPosts);

router.post('/posts/:postId/toggle-like', communityController.toggleLike);

router.put(
  '/posts/:postId',
  [
    body('content').notEmpty().trim(),
    body('mediaUrls').optional().isArray(),
    body('removedMediaUrls').optional().isArray()
  ],
  validateRequest,
  communityController.editPost
);

router.delete('/posts/:postId', communityController.deletePost);

// Comment routes - All moved to community controller
router.get('/posts/:postId/comments', communityController.getCommentsByPost);

router.get('/posts/:postId/comments/count', communityController.getCommentCount);

router.post(
  '/posts/:postId/comments',
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
  communityController.createComment
);

router.get('/comments/:commentId', communityController.getCommentById);

router.put(
  '/comments/:commentId',
  [
    body('content')
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment content must be between 1 and 1000 characters')
  ],
  validateRequest,
  communityController.updateComment
);

router.delete('/comments/:commentId', communityController.deleteComment);

router.get('/comments/:commentId/replies', communityController.getReplies);

export { router as communityRouter };