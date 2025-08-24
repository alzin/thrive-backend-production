import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { IBookingRepository, Booking } from '../../../domain/repositories/IBookingRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';

export interface CancelBookingDTO {
  userId: string;
  bookingId: string;
}

export class CancelBookingUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private bookingRepository: IBookingRepository,
    private profileRepository: IProfileRepository
  ) { }

  async execute(dto: CancelBookingDTO): Promise<void> {
    const booking = await this.bookingRepository.findById(dto.bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.userId !== dto.userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Booking is already cancelled or completed');
    }

    const session = await this.sessionRepository.findById(booking.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Cancel the booking
    await this.bookingRepository.cancel(dto.bookingId);

    // Decrement session participants count
    await this.sessionRepository.decrementParticipants(booking.sessionId);

    // Refund points if the session required points
    if (session.pointsRequired > 0) {
      await this.profileRepository.updatePoints(dto.userId, session.pointsRequired);
    }
  }
}