// backend/src/infrastructure/web/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUserUseCase';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/RefreshTokenUseCase';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { PaymentRepository } from '../../database/repositories/PaymentRepository';
import { EmailService } from '../../services/EmailService';
import { PasswordService } from '../../services/PasswordService';
import { TokenService } from '../../services/TokenService';
import { PaymentService } from '../../services/PaymentService';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { getAccessTokenCookieConfig, getRefreshTokenCookieConfig, COOKIE_NAMES } from '../../config/cookieConfig';
import { VerificationCodeService } from '../../services/VerificationCodeService';
import { ResetPasswordUseCase } from '../../../application/use-cases/auth/ResetPasswordUseCase';
import { RequestPasswordResetUseCase } from '../../../application/use-cases/auth/RequestPasswordResetUseCase';
import { RegisterWithVerificationUseCase } from '../../../application/use-cases/auth/RegisterWithVerificationUseCase';
import { VerifyEmailUseCase } from '../../../application/use-cases/auth/VerifyEmailUseCase';
import { ResendVerificationCodeUseCase } from '../../../application/use-cases/auth/ResendVerificationCodeUseCase';

export class AuthController {
  private verificationCodeService: VerificationCodeService;

  constructor() {
    this.verificationCodeService = new VerificationCodeService();

    // Bind all methods to preserve 'this' context
    this.register = this.register.bind(this);
    this.sendVerificationCode = this.sendVerificationCode.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.completeRegistration = this.completeRegistration.bind(this);
    this.login = this.login.bind(this);
    this.refresh = this.refresh.bind(this);
    this.logout = this.logout.bind(this);
    this.checkAuth = this.checkAuth.bind(this);
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, stripePaymentIntentId } = req.body;

      const registerUseCase = new RegisterUserUseCase(
        new UserRepository(),
        new ProfileRepository(),
        new PaymentRepository(),
        new EmailService(),
        new PasswordService(),
        new PaymentService()
      );

      const result = await registerUseCase.execute({ email, stripePaymentIntentId });

      res.status(201).json({
        message: 'Registration successful. Check your email for login credentials.',
        userId: result.user.id
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async sendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Check if user already exists
      const userRepository = new UserRepository();
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'This email is already registered, Please Login' });
        return;
      }

      // Generate and send code
      const code = await this.verificationCodeService.generateAndSendCode(email);

      res.json({
        message: 'Verification code sent successfully',
        // In production, don't send the code in response
        ...(process.env.NODE_ENV === 'development' && { code }),
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;

      const isValid = await this.verificationCodeService.verifyCode(email, code);

      if (!isValid) {
        res.status(400).json({ error: 'Invalid or expired verification code' });
        return;
      }

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  }

  async completeRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, password, stripePaymentIntentId } = req.body;

      // Verify email was verified
      const isEmailVerified = await this.verificationCodeService.isEmailVerified(email);
      if (!isEmailVerified) {
        res.status(400).json({ error: 'Email not verified' });
        return;
      }

      const registerUseCase = new RegisterUserUseCase(
        new UserRepository(),
        new ProfileRepository(),
        new PaymentRepository(),
        new EmailService(),
        new PasswordService(),
        new PaymentService()
      );

      const result = await registerUseCase.executeWithPassword({
        email,
        name,
        password,
        stripePaymentIntentId
      });

      // Auto-login after registration
      const tokenService = new TokenService();
      const tokens = tokenService.generateTokenPair({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role
      });

      // Set cookies like in the login method
      const accessTokenConfig = getAccessTokenCookieConfig();
      const refreshTokenConfig = getRefreshTokenCookieConfig();

      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
        ...accessTokenConfig,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
        ...refreshTokenConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role
        },
        token: tokens.accessToken // Include access token in response if needed
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const loginUseCase = new LoginUseCase(
        new UserRepository(),
        new PasswordService(),
        new TokenService()
      );

      const { response, tokens } = await loginUseCase.execute({
        email,
        password,
        ipAddress,
        userAgent
      });

      // Set cookies
      const accessTokenConfig = getAccessTokenCookieConfig();
      const refreshTokenConfig = getRefreshTokenCookieConfig();

      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
        ...accessTokenConfig,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
        ...refreshTokenConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(response);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

      if (!refreshToken) {
        res.status(403).json({ error: 'Refresh token not provided' });
        return;
      }

      const refreshAccessTokenUseCase = new RefreshTokenUseCase(
        new UserRepository(),
        new TokenService()
      );

      const { response, tokens } = await refreshAccessTokenUseCase.execute({ refreshToken });

      // Set new cookies
      const accessTokenConfig = getAccessTokenCookieConfig();
      const refreshTokenConfig = getRefreshTokenCookieConfig();

      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
        ...accessTokenConfig,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
        ...refreshTokenConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(response);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async logout(req: Request, res: Response): Promise<void> {

    const accessTokenConfig = getAccessTokenCookieConfig();
    const refreshTokenConfig = getRefreshTokenCookieConfig();

    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, accessTokenConfig);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, refreshTokenConfig);

    res.json({ message: 'Logout successful' });
  }

  async checkAuth(req: Request, res: Response): Promise<void> {
    // This endpoint can be used to check if user is authenticated
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      res.status(403).json({ authenticated: false });
      return;
    }

    if (!accessToken) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const tokenService = new TokenService();
    const payload = tokenService.verifyAccessToken(accessToken);

    if (!payload) {
      res.status(401).json({ authenticated: false });
      return;
    }

    res.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role
      }
    });
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
        new UserRepository(),
        new EmailService(),
        new TokenService()
      );

      await requestPasswordResetUseCase.execute({ email });

      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      const resetPasswordUseCase = new ResetPasswordUseCase(
        new UserRepository(),
        new PasswordService(),
        new TokenService()
      );

      await resetPasswordUseCase.execute({ token, newPassword });

      res.json({
        message: 'Password reset successful. You can now login with your new password.'
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('Password must be')) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async validateResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const tokenService = new TokenService();
      const payload = tokenService.verifyAccessToken(token);

      if (!payload) {
        res.status(400).json({ valid: false, error: 'Invalid or expired token' });
        return;
      }

      const userRepository = new UserRepository();
      const user = await userRepository.findById(payload.userId);

      if (!user) {
        res.status(400).json({ valid: false, error: 'Invalid token' });
        return;
      }

      res.json({ valid: true, email: user.email });
    } catch (error) {
      res.status(400).json({ valid: false, error: 'Invalid token' });
    }
  }

  async registerWithVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      const registerUseCase = new RegisterWithVerificationUseCase(
        new UserRepository(),
        new PasswordService(),
        new EmailService(),
        new ProfileRepository()
      );

      const { user, verificationCode } = await registerUseCase.execute({
        name,
        email,
        password,
      });

      res.status(201).json({
        message: 'Registration successful. Please check your email for verification code.',
        ...(process.env.NODE_ENV === 'development' && { verificationCode }),
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async verifyEmailCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;

      const verifyEmailUseCase = new VerifyEmailUseCase(
        new UserRepository(),
        new TokenService(),
      );

      const { user, tokens, csrfToken } = await verifyEmailUseCase.execute(
        { email, code }
      );

      // Set cookies
      const accessTokenConfig = getAccessTokenCookieConfig();
      const refreshTokenConfig = getRefreshTokenCookieConfig();

      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
        ...accessTokenConfig,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
        ...refreshTokenConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user,
        csrfToken,
        message: 'Email verified successfully'
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }


  async resendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const resendUseCase = new ResendVerificationCodeUseCase(
        new UserRepository(),
        new EmailService()
      );

      const { verificationCode } = await resendUseCase.execute({ email });

      res.json({
        message: 'Verification code resent successfully',
        ...(process.env.NODE_ENV === 'development' && { verificationCode }),

      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

}

