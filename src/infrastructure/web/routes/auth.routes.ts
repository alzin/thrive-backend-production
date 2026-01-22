// backend/src/infrastructure/web/routes/auth.routes.ts

import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';

const authRouter = (authController: AuthController): Router => {
  const router = Router();

  router.post(
    '/register',
    [
      body('email').isEmail(),
    ],
    validateRequest,
    authController.register.bind(authController)
  );

  router.post(
    '/login',
    // loginLimiter,
    [
      body('email').isEmail(),
      body('password').notEmpty()
    ],
    validateRequest,
    authController.login.bind(authController)
  );

  router.post('/refresh', authController.refresh.bind(authController));
  router.post('/logout', authController.logout.bind(authController));
  router.get('/check', authController.checkAuth.bind(authController));

  router.post(
    '/forgot-password',
    [
      body('email').isEmail()
    ],
    validateRequest,
    authController.requestPasswordReset.bind(authController)
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
    authController.resetPassword.bind(authController)
  );

  router.get(
    '/reset-password/validate/:token',
    authController.validateResetToken.bind(authController)
  );

  router.post(
    '/register-new',
    [
      body('name').notEmpty().trim(),
      body('email').isEmail(),
      body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/),
    ],
    validateRequest,
    authController.registerWithVerification.bind(authController)
  );

  router.post(
    '/verify-email-code',
    [
      body('email').isEmail(),
      body('code').isLength({ min: 6, max: 6 }).isNumeric(),
    ],
    validateRequest,
    authController.verifyEmailCode.bind(authController)
  );

  router.post(
    '/resend-verification',
    [
      body('email').isEmail(),
    ],
    validateRequest,
    authController.resendVerificationCode.bind(authController)
  );
  return router;
};

export default authRouter;