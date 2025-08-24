import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { IBookingRepository, Booking } from '../../../domain/repositories/IBookingRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { ActivityService } from '../../../infrastructure/services/ActivityService';

export interface CreateBookingDTO {
  userId: string;
  sessionId: string;
}

export class CreateBookingUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private bookingRepository: IBookingRepository,
    private profileRepository: IProfileRepository,
    private activityService: ActivityService
  ) { }

  async execute(dto: CreateBookingDTO): Promise<Booking> {
    const session = await this.sessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.canBook()) {
      throw new Error('Session cannot be booked');
    }

    // Check user's points if required
    if (session.pointsRequired > 0) {
      const profile = await this.profileRepository.findByUserId(dto.userId);
      if (!profile || profile.points < session.pointsRequired) {
        throw new Error('Insufficient points');
      }
    }

    // Check active bookings limit (max 2)
    const activeBookings = await this.bookingRepository.findActiveByUserId(dto.userId);
    if (activeBookings.length >= 2) {
      throw new Error('Maximum active bookings reached');
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

    // #activity
    await this.activityService.logSessionBooked(
      dto.userId,
      session.title,
      session.scheduledAt
    );

    return savedBooking;
  }
}