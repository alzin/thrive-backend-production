import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { GetUpcomingSessionsUseCase } from '../../../application/use-cases/session/GetUpcomingSessionsUseCase';
import { GetSessionByIdUseCase } from '../../../application/use-cases/session/GetSessionByIdUseCase';
import { GetSessionsByDateRangeUseCase } from '../../../application/use-cases/session/GetSessionsByDateRangeUseCase';
import { GetAllSessionsUseCase } from '../../../application/use-cases/session/GetAllSessionsUseCase';

export class SessionController {
  constructor(
    private getUpcomingSessionsUseCase: GetUpcomingSessionsUseCase,
    private getSessionByIdUseCase: GetSessionByIdUseCase,
    private getSessionsByDateRangeUseCase: GetSessionsByDateRangeUseCase,
    private getAllSessionsUseCase: GetAllSessionsUseCase
  ) { }

  async getUpcomingSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;

      const enhancedSessions = await this.getUpcomingSessionsUseCase.execute({
        limit: limit ? Number(limit) : undefined
      });

      res.json(enhancedSessions);
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await this.getSessionByIdUseCase.execute({ sessionId });

      res.json(session);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async getSessionsByDateRange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const sessions = await this.getSessionsByDateRangeUseCase.execute({
        startDate: String(startDate),
        endDate: String(endDate)
      });

      res.json(sessions);
    } catch (error) {
      if (error instanceof Error && error.message === 'Start date and end date are required') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async getAllSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, type, isActive } = req.query;

      const result = await this.getAllSessionsUseCase.execute({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        type: type ? String(type) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
