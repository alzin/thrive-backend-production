import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateBookingUseCase } from '../../../application/use-cases/booking/CreateBookingUseCase';
import { CancelBookingUseCase } from '../../../application/use-cases/booking/CancelBookingUseCase';
import { SessionRepository } from '../../database/repositories/SessionRepository';
import { BookingRepository } from '../../database/repositories/BookingRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { ActivityService } from '../../services/ActivityService';

export class BookingController {
  async createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.body;

      const createBookingUseCase = new CreateBookingUseCase(
        new SessionRepository(),
        new BookingRepository(),
        new ProfileRepository(),
        new ActivityService()
      );

      const booking = await createBookingUseCase.execute({
        userId: req.user!.userId,
        sessionId
      });

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingRepository = new BookingRepository();
      const bookings = await bookingRepository.findByUserId(req.user!.userId);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = req.params;

      const cancelBookingUseCase = new CancelBookingUseCase(
        new SessionRepository(),
        new BookingRepository(),
        new ProfileRepository()
      );

      await cancelBookingUseCase.execute({
        userId: req.user!.userId,
        bookingId
      });

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }
}