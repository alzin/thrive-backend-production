import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SessionRepository } from '../../database/repositories/SessionRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';

export class SessionController {
  async getUpcomingSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      const sessionRepository = new SessionRepository();

      const sessions = await sessionRepository.findUpcoming(Number(limit));

      // Enhance sessions with host information
      const userRepository = new UserRepository();
      const profileRepository = new ProfileRepository();

      const enhancedSessions = await Promise.all(
        sessions.map(async (session) => {
          const host = await userRepository.findById(session.hostId);
          const hostProfile = await profileRepository.findByUserId(session.hostId);

          return {
            ...session,
            hostName: hostProfile?.name || host?.email || 'Unknown Host',
            hostEmail: host?.email,
          };
        })
      );

      res.json(enhancedSessions);
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const sessionRepository = new SessionRepository();

      const session = await sessionRepository.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Enhance with host information
      const userRepository = new UserRepository();
      const profileRepository = new ProfileRepository();

      const host = await userRepository.findById(session.hostId);
      const hostProfile = await profileRepository.findByUserId(session.hostId);

      res.json({
        ...session,
        hostName: hostProfile?.name || host?.email || 'Unknown Host',
        hostEmail: host?.email,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionsByDateRange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const sessionRepository = new SessionRepository();
      const sessions = await sessionRepository.findByDateRange(
        new Date(String(startDate)),
        new Date(String(endDate))
      );

      res.json(sessions);
    } catch (error) {
      next(error);
    }
  }

  async getAllSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, type, isActive } = req.query;
      const sessionRepository = new SessionRepository();

      // Convert query params to appropriate types
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build filter conditions
      const filters: any = {};

      if (type && (type === 'SPEAKING' || type === 'EVENT')) {
        filters.type = type;
      }

      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }

      // Get sessions with pagination and filters
      const { sessions, total } = await sessionRepository.findAllWithPagination({
        offset,
        limit: limitNum,
        filters
      });

      // Enhance sessions with host information
      const userRepository = new UserRepository();
      const profileRepository = new ProfileRepository();

      const enhancedSessions = await Promise.all(
        sessions.map(async (session) => {
          const host = await userRepository.findById(session.hostId);
          const hostProfile = await profileRepository.findByUserId(session.hostId);

          return {
            ...session,
            hostName: hostProfile?.name || host?.email || 'Unknown Host',
            hostEmail: host?.email,
          };
        })
      );

      res.json({
        sessions: enhancedSessions,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      });
    } catch (error) {
      next(error);
    }
  }
}