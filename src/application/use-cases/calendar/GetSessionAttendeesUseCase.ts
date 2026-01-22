import { BookingRepository } from "../../../infrastructure/database/repositories/BookingRepository";
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";

export class GetSessionAttendeesUseCase {
    constructor(
        private bookingRepository: BookingRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(params: {
        sessionId: string;
    }) {
        const { sessionId } = params;

        const bookings = await this.bookingRepository.findBySessionId(sessionId);

        const attendees = await Promise.all(
            bookings
                .filter(b => b.status === 'CONFIRMED')
                .map(async (booking) => {
                    const profile = await this.profileRepository.findByUserId(booking.userId);
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

        return attendees;
    }
}