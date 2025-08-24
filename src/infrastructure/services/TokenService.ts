// backend/src/infrastructure/services/TokenService.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { ITokenService, TokenPayload, TokenPair } from '../../application/services/ITokenService';

export class TokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly csrfSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || 'default-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    this.csrfSecret = process.env.CSRF_SECRET || 'csrf-secret';
    this.accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '1d';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  }

  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload.userId),
    };
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn
    } as SignOptions);
  }


  generateRefreshToken(userId: string): string {
    const tokenId = crypto.randomBytes(32).toString('hex');
    return jwt.sign(
      { userId, tokenId },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiresIn } as SignOptions
    );
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as { userId: string };
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }

  generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyCSRFToken(token: string): boolean {
    // In a real implementation, you'd verify against stored CSRF tokens
    return token.length === 64; // Simple validation for now
  }

  generatePasswordResetToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'password-reset' },
      this.accessTokenSecret,
      { expiresIn: '1h' } as SignOptions // Shorter expiration for security
    );
  }
}