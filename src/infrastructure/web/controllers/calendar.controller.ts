import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SessionRepository } from '../../database/repositories/SessionRepository';
import { BookingRepository } from '../../database/repositories/BookingRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export class CalendarController {
  async getCalendarSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { year, month, view = 'month' } = req.query;

      let startDate: Date;
      let endDate: Date;

      if (view === 'month' && year && month) {
        const date = new Date(Number(year), Number(month) - 1);
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
      } else if (view === 'week') {
        const { week } = req.query;
        const date = week ? new Date(String(week)) : new Date();
        startDate = startOfWeek(date);
        endDate = endOfWeek(date);
      } else {
        // Default to current month
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
      }

      const sessionRepository = new SessionRepository();
      const bookingRepository = new BookingRepository();

      // Get active sessions in date range
      const sessions = await sessionRepository.findByDateRange(startDate, endDate);

      // Get user's bookings
      const userBookings = await bookingRepository.findActiveByUserId(req.user!.userId);
      const bookedSessionIds = userBookings.map(b => b.sessionId);

      // Enhance sessions with booking status
      const enhancedSessions = sessions.map(session => ({
        ...session,
        isBooked: bookedSessionIds.includes(session.id),
        canBook: session.canBook() && userBookings.length < 2 && !bookedSessionIds.includes(session.id),
      }));

      res.json({
        sessions: enhancedSessions,
        dateRange: { start: startDate, end: endDate },
        userBookingCount: userBookings.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionsByDay(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.params;
      const targetDate = new Date(date);

      const sessionRepository = new SessionRepository();
      const bookingRepository = new BookingRepository();

      // Get sessions for specific day
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const sessions = await sessionRepository.findByDateRange(startOfDay, endOfDay);

      // Get user's bookings
      const userBookings = await bookingRepository.findActiveByUserId(req.user!.userId);
      const bookedSessionIds = userBookings.map(b => b.sessionId);

      const enhancedSessions = sessions.map(session => ({
        ...session,
        isBooked: bookedSessionIds.includes(session.id),
        participantsList: [], // In production, you'd fetch actual participants
      }));

      res.json(enhancedSessions);
    } catch (error) {
      next(error);
    }
  }

  async checkBookingEligibility(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;

      const sessionRepository = new SessionRepository();
      const bookingRepository = new BookingRepository();
      const profileRepository = new ProfileRepository();

      const session = await sessionRepository.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const userBookings = await bookingRepository.findActiveByUserId(req.user!.userId);
      const profile = await profileRepository.findByUserId(req.user!.userId);

      const eligibility = {
        canBook: true,
        reasons: [] as string[],
        session: {
          id: session.id,
          title: session.title,
          pointsRequired: session.pointsRequired,
          spotsAvailable: session.maxParticipants - session.currentParticipants,
        },
        user: {
          points: profile?.points || 0,
          activeBookings: userBookings.length,
        },
      };

      // Check various conditions
      if (userBookings.find(b => b.sessionId === sessionId)) {
        eligibility.canBook = false;
        eligibility.reasons.push('Already booked this session');
      }

      if (userBookings.length >= 2) {
        eligibility.canBook = false;
        eligibility.reasons.push('Maximum active bookings reached (2)');
      }

      if (session.isFull()) {
        eligibility.canBook = false;
        eligibility.reasons.push('Session is full');
      }

      if (session.pointsRequired > 0 && (!profile || profile.points < session.pointsRequired)) {
        eligibility.canBook = false;
        eligibility.reasons.push(`Insufficient points (need ${session.pointsRequired}, have ${profile?.points || 0})`);
      }

      if (new Date(session.scheduledAt) <= new Date()) {
        eligibility.canBook = false;
        eligibility.reasons.push('Session has already started');
      }

      if (!session.isActive) {
        eligibility.canBook = false;
        eligibility.reasons.push('Session is not active');
      }

      res.json(eligibility);
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingRepository = new BookingRepository();
      const sessionRepository = new SessionRepository();

      const bookings = await bookingRepository.findActiveByUserId(req.user!.userId);

      // Enhance bookings with session details
      const enhancedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const session = await sessionRepository.findById(booking.sessionId);
          return {
            ...booking,
            session,
          };
        })
      );

      // Sort by session date and filter out past sessions
      const upcomingBookings = enhancedBookings
        .filter(booking => booking.session && new Date(booking.session.scheduledAt) > new Date())
        .sort((a, b) => {
          if (!a.session || !b.session) return 0;
          return new Date(a.session.scheduledAt).getTime() - new Date(b.session.scheduledAt).getTime();
        });

      res.json(upcomingBookings);
    } catch (error) {
      next(error);
    }
  }

  async getSessionAttendees(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const bookingRepository = new BookingRepository();
      const profileRepository = new ProfileRepository();

      const bookings = await bookingRepository.findBySessionId(sessionId);

      const attendees = await Promise.all(
        bookings
          .filter(b => b.status === 'CONFIRMED')
          .map(async (booking) => {
            const profile = await profileRepository.findByUserId(booking.userId);
            return {
              bookingId: booking.id,
              userId: booking.userId,
              name: profile?.name || 'Unknown',
              profilePhoto: profile?.profilePhoto,
              level: profile?.level || 1,
              languageLevel: profile?.languageLevel || 'N5',
            };
          })
      );

      res.json(attendees);
    } catch (error) {
      next(error);
    }
  }
}