// backend/src/application/services/ITokenService.ts
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateTokenPair(payload: TokenPayload): TokenPair;
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(userId: string): string;
  verifyAccessToken(token: string): TokenPayload | null;
  verifyRefreshToken(token: string): string | null; // Returns userId
  generatePasswordResetToken(userId: string, email: string): string; // Add this
  generateCSRFToken(): string;
  verifyCSRFToken(token: string): boolean;
}