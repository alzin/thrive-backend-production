import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { IBookingRepository, Booking } from '../../../domain/repositories/IBookingRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { ActivityService } from '../../../infrastructure/services/ActivityService';
import { IBookingValidationService } from '../../../domain/services/IBookingValidationService';

export interface CreateBookingDTO {
  userId: string;
  sessionId: string;
}

export enum BookingErrorCode {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  NO_SUBSCRIPTION = 'NO_SUBSCRIPTION',
  PLAN_ACCESS_DENIED = 'PLAN_ACCESS_DENIED',
  ACTIVE_BOOKING_LIMIT = 'ACTIVE_BOOKING_LIMIT',
  MONTHLY_LIMIT_EXCEEDED = 'MONTHLY_LIMIT_EXCEEDED',
  INSUFFICIENT_NOTICE = 'INSUFFICIENT_NOTICE',
  SESSION_FULL = 'SESSION_FULL',
  ALREADY_BOOKED = 'ALREADY_BOOKED',
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  SESSION_INACTIVE = 'SESSION_INACTIVE',
  SESSION_PAST = 'SESSION_PAST',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

export class BookingError extends Error {
  constructor(
    public code: BookingErrorCode,
    public reasons: string[]
  ) {
    super(reasons.join('; '));
    this.name = 'BookingError';
  }
}

export class CreateBookingUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private bookingRepository: IBookingRepository,
    private profileRepository: IProfileRepository,
    private activityService: ActivityService,
    private bookingValidationService: IBookingValidationService
  ) { }

  async execute(dto: CreateBookingDTO): Promise<Booking> {
    // Run comprehensive validation
    const validation = await this.bookingValidationService.validateBooking({
      userId: dto.userId,
      sessionId: dto.sessionId
    });

    // If validation fails, throw detailed error
    if (!validation.canBook) {
      const errorCode = this.determineErrorCode(validation);
      throw new BookingError(errorCode, validation.reasons);
    }

    // Validation passed - proceed with booking
    const session = await this.sessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new BookingError(BookingErrorCode.SESSION_NOT_FOUND, ['Session not found']);
    }

    // Create booking
    const booking: Booking = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      userId: dto.userId,
      sessionId: dto.sessionId,
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedBooking = await this.bookingRepository.create(booking);

    // Increment session participants
    await this.sessionRepository.incrementParticipants(dto.sessionId);

    // Deduct points if required
    if (session.pointsRequired > 0) {
      await this.profileRepository.updatePoints(dto.userId, -session.pointsRequired);
    }

    // Log activity
    await this.activityService.logSessionBooked(
      dto.userId,
      session.title,
      session.scheduledAt
    );

    return savedBooking;
  }

  /**
   * Determines the most relevant error code based on validation details
   */
  private determineErrorCode(validation: { canBook: boolean; reasons: string[]; validationDetails: any }): BookingErrorCode {
    const details = validation.validationDetails;

    // Order matters - check most specific conditions first
    if (!details.hasActiveSubscription) {
      return BookingErrorCode.NO_SUBSCRIPTION;
    }
    if (details.isAlreadyBooked) {
      return BookingErrorCode.ALREADY_BOOKED;
    }
    if (!details.meetsMinimumNotice && details.hoursUntilSession > 0) {
      return BookingErrorCode.INSUFFICIENT_NOTICE;
    }
    if (details.hoursUntilSession <= 0) {
      return BookingErrorCode.SESSION_PAST;
    }
    if (!details.isSessionActive) {
      return BookingErrorCode.SESSION_INACTIVE;
    }
    if (!details.canAccessSessionType) {
      return BookingErrorCode.PLAN_ACCESS_DENIED;
    }
    if (details.activeBookingsRemaining <= 0) {
      return BookingErrorCode.ACTIVE_BOOKING_LIMIT;
    }
    if (details.remainingMonthlyBookings !== null && details.remainingMonthlyBookings <= 0) {
      return BookingErrorCode.MONTHLY_LIMIT_EXCEEDED;
    }
    if (details.spotsAvailable <= 0) {
      return BookingErrorCode.SESSION_FULL;
    }
    if (!details.hasEnoughPoints) {
      return BookingErrorCode.INSUFFICIENT_POINTS;
    }

    return BookingErrorCode.VALIDATION_FAILED;
  }
}