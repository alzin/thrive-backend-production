// backend/src/infrastructure/web/controllers/booking.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateBookingUseCase, BookingError, BookingErrorCode } from '../../../application/use-cases/booking/CreateBookingUseCase';
import { CancelBookingUseCase } from '../../../application/use-cases/booking/CancelBookingUseCase';
import { GetMyBookingsUseCase } from '../../../application/use-cases/booking/GetMyBookingsUseCase';
import { GetBookingLimitsUseCase } from '../../../application/use-cases/booking/GetBookingLimitsUseCase';

export class BookingController {
  constructor(
    private createBookingUseCase: CreateBookingUseCase,
    private getMyBookingsUseCase: GetMyBookingsUseCase,
    private cancelBookingUseCase: CancelBookingUseCase,
    private getBookingLimitsUseCase: GetBookingLimitsUseCase
  ) { }

  /**
   * Create a new booking

   */
  async createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.body;

      const booking = await this.createBookingUseCase.execute({
        userId: req.user!.userId,
        sessionId
      });

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Session booked successfully'
      });
    } catch (error) {
      // Handle BookingError with specific error codes
      if (error instanceof BookingError) {
        const statusCode = this.getStatusCodeForBookingError(error.code);
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            reasons: error.reasons
          }
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get all bookings for the authenticated user
   */
  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await this.getMyBookingsUseCase.execute({
        userId: req.user!.userId
      });

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking limits for the authenticated user
   */
  async getBookingLimits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limits = await this.getBookingLimitsUseCase.execute({
        userId: req.user!.userId
      });

      res.json({
        success: true,
        data: limits
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel an existing booking
   */
  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = req.params;

      await this.cancelBookingUseCase.execute({
        userId: req.user!.userId,
        bookingId
      });

      res.json({
        success: true,
        message: 'Booking cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Maps booking error codes to HTTP status codes
   */
  private getStatusCodeForBookingError(code: BookingErrorCode): number {
    switch (code) {
      case BookingErrorCode.SESSION_NOT_FOUND:
        return 404;
      case BookingErrorCode.NO_SUBSCRIPTION:
      case BookingErrorCode.PLAN_ACCESS_DENIED:
        return 403;
      case BookingErrorCode.ACTIVE_BOOKING_LIMIT:
      case BookingErrorCode.MONTHLY_LIMIT_EXCEEDED:
      case BookingErrorCode.INSUFFICIENT_NOTICE:
      case BookingErrorCode.SESSION_FULL:
      case BookingErrorCode.ALREADY_BOOKED:
      case BookingErrorCode.INSUFFICIENT_POINTS:
      case BookingErrorCode.SESSION_INACTIVE:
      case BookingErrorCode.SESSION_PAST:
        return 400;
      default:
        return 400;
    }
  }
}