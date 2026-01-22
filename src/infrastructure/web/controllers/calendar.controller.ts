// backend/src/infrastructure/web/controllers/calendar.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GetCalendarSessionsUseCase } from '../../../application/use-cases/calendar/GetCalendarSessionsUseCase';
import { GetSessionsByDayUseCase } from '../../../application/use-cases/calendar/GetSessionsByDayUseCase';
import { CheckBookingEligibilityUseCase } from '../../../application/use-cases/calendar/CheckBookingEligibilityUseCase';
import { GetUpcomingBookingsUseCase } from '../../../application/use-cases/calendar/GetUpcomingBookingsUseCase';
import { GetSessionAttendeesUseCase } from '../../../application/use-cases/calendar/GetSessionAttendeesUseCase';

export class CalendarController {
  constructor(
    private getCalendarSessionsUseCase: GetCalendarSessionsUseCase,
    private getSessionsByDayUseCase: GetSessionsByDayUseCase,
    private checkBookingEligibilityUseCase: CheckBookingEligibilityUseCase,
    private getUpcomingBookingsUseCase: GetUpcomingBookingsUseCase,
    private getSessionAttendeesUseCase: GetSessionAttendeesUseCase
  ) { }

  async getCalendarSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { year, month, view = 'month', week } = req.query;

      const result = await this.getCalendarSessionsUseCase.execute({
        year: year as string,
        month: month as string,
        view: view as string,
        week: week as string,
        userId: req.user!.userId
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSessionsByDay(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.params;

      const result = await this.getSessionsByDayUseCase.execute({
        date,
        userId: req.user!.userId
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async checkBookingEligibility(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;

      const eligibility = await this.checkBookingEligibilityUseCase.execute({
        sessionId,
        userId: req.user!.userId
      });

      res.json(eligibility);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async getUpcomingBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const upcomingBookings = await this.getUpcomingBookingsUseCase.execute({
        userId: req.user!.userId
      });

      res.json(upcomingBookings);
    } catch (error) {
      next(error);
    }
  }

  async getSessionAttendees(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;

      const attendees = await this.getSessionAttendeesUseCase.execute({
        sessionId
      });

      res.json(attendees);
    } catch (error) {
      next(error);
    }
  }
}