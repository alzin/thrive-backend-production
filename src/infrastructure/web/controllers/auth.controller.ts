// backend/src/infrastructure/web/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUserUseCase';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/RefreshTokenUseCase';
import { ResetPasswordUseCase } from '../../../application/use-cases/auth/ResetPasswordUseCase';
import { RequestPasswordResetUseCase } from '../../../application/use-cases/auth/RequestPasswordResetUseCase';
import { RegisterWithVerificationUseCase } from '../../../application/use-cases/auth/RegisterWithVerificationUseCase';
import { ResendVerificationCodeUseCase } from '../../../application/use-cases/auth/ResendVerificationCodeUseCase';
import { CheckAuthUseCase } from '../../../application/use-cases/auth/CheckAuthUseCase';
import { ValidateResetTokenUseCase } from '../../../application/use-cases/auth/ValidateResetTokenUseCase';
import { VerifyEmailWithCodeUseCase } from '../../../application/use-cases/auth/VerifyEmailWithCodeUseCase';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { getAccessTokenCookieConfig, getRefreshTokenCookieConfig, COOKIE_NAMES } from '../../config/cookieConfig';
import { ENV_CONFIG } from '../../config/env.config';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly validateResetTokenUseCase: ValidateResetTokenUseCase,
    private readonly registerWithVerificationUseCase: RegisterWithVerificationUseCase,
    private readonly verifyEmailWithCodeUseCase: VerifyEmailWithCodeUseCase,
    private readonly resendVerificationCodeUseCase: ResendVerificationCodeUseCase,
    private readonly checkAuthUseCase: CheckAuthUseCase
  ) { }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, stripePaymentIntentId } = req.body;

      const result = await this.registerUserUseCase.execute({
        email,
        stripePaymentIntentId
      });

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

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const { response, tokens } = await this.loginUseCase.execute({
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

      const { response, tokens } = await this.refreshTokenUseCase.execute({
        refreshToken
      });

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
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    const result = this.checkAuthUseCase.execute({
      accessToken,
      refreshToken
    });

    res.status(result.status).json(result.authenticated ? {
      authenticated: result.authenticated,
      user: result.user
    } : {
      authenticated: result.authenticated
    });
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      await this.requestPasswordResetUseCase.execute({ email });

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

      await this.resetPasswordUseCase.execute({ token, newPassword });

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

      const result = await this.validateResetTokenUseCase.execute({ token });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        valid: false,
        error: error.message || 'Invalid token'
      });
    }
  }

  async registerWithVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      const { user, verificationCode } = await this.registerWithVerificationUseCase.execute({
        name,
        email,
        password,
      });

      res.status(201).json({
        message: 'Registration successful. Please check your email for verification code.',
        ...(ENV_CONFIG.NODE_ENV === 'development' && { verificationCode }),
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

      const { user, tokens, csrfToken } = await this.verifyEmailWithCodeUseCase.execute({
        email,
        code
      });

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

      const { verificationCode } = await this.resendVerificationCodeUseCase.execute({
        email
      });

      res.json({
        message: 'Verification code resent successfully',
        ...(ENV_CONFIG.NODE_ENV === 'development' && { verificationCode }),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

}

