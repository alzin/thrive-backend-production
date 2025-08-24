// backend/src/infrastructure/web/routes/profile.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const profileController = new ProfileController();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed'));
    }
  }
});

// Apply authentication to all routes
router.use(authenticate);

// Get current user's profile
router.get('/me', profileController.getMyProfile.bind(profileController));

// Update current user's profile
router.put(
  '/me',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    body('languageLevel')
      .optional()
      .isIn(['N5', 'N4', 'N3', 'N2', 'N1'])
      .withMessage('Invalid language level')
  ],
  validateRequest,
  profileController.updateProfile.bind(profileController)
);

// Upload profile photo
router.post(
  '/me/photo', 
  upload.single('photo'), 
  profileController.uploadProfilePhoto.bind(profileController)
);

// Delete profile photo
router.delete(
  '/me/photo',
  profileController.deleteProfilePhoto.bind(profileController)
);

// Get any user's public profile
router.get(
  '/:userId',
  profileController.getUserProfile.bind(profileController)
);

export { router as profileRouter };