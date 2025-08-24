// backend/src/infrastructure/web/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../services/TokenService';
import { COOKIE_NAMES } from '../../config/cookieConfig';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!accessToken) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const tokenService = new TokenService();
    const payload = tokenService.verifyAccessToken(accessToken);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
};

// CSRF Protection Middleware
export const validateCSRF = (req: Request, res: Response, next: NextFunction): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;

  if (!csrfToken) {
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }

  const tokenService = new TokenService();
  if (!tokenService.verifyCSRFToken(csrfToken)) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
};