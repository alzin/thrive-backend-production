// backend/src/infrastructure/web/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { passwordResetLimiter, loginLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();
const authController = new AuthController();

// New endpoints for the updated flow
router.post(
  '/send-verification-code',
  [
    body('email').isEmail(),
  ],
  validateRequest,
  authController.sendVerificationCode
);

router.post(
  '/verify-email',
  [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }),
  ],
  validateRequest,
  authController.verifyEmail
);

router.post(
  '/complete-registration',
  [
    body('email').isEmail(),
    body('name').notEmpty().trim(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/),
    // body('stripePaymentIntentId').notEmpty(),
  ],
  validateRequest,
  authController.completeRegistration
);


router.post(
  '/register',
  [
    body('email').isEmail(),
  ],
  validateRequest,
  authController.register
);

// Existing endpoints
router.post(
  '/login',
  // loginLimiter,
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  validateRequest,
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/check', authController.checkAuth);

// Password reset endpoints
router.post(
  '/forgot-password',
  // passwordResetLimiter,
  [
    body('email').isEmail()
  ],
  validateRequest,
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().trim(),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character')
  ],
  validateRequest,
  authController.resetPassword
);

router.get(
  '/reset-password/validate/:token',
  authController.validateResetToken
);

router.post(
  '/register-new',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/),
  ],
  validateRequest,
  authController.registerWithVerification
);

router.post(
  '/verify-email-code',
  [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  validateRequest,
  authController.verifyEmailCode
);

router.post(
  '/resend-verification',
  [
    body('email').isEmail(),
  ],
  validateRequest,
  authController.resendVerificationCode
);

export { router as authRouter };