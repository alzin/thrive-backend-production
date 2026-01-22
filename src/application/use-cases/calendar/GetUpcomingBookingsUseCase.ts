import { BookingRepository } from "../../../infrastructure/database/repositories/BookingRepository";
import { SessionRepository } from "../../../infrastructure/database/repositories/SessionRepository";

export class GetUpcomingBookingsUseCase {
    constructor(
        private bookingRepository: BookingRepository,
        private sessionRepository: SessionRepository
    ) { }

    async execute(params: {
        userId: string;
    }) {
        const { userId } = params;

        const bookings = await this.bookingRepository.findActiveByUserId(userId);

        // Enhance bookings with session details
        const enhancedBookings = await Promise.all(
            bookings.map(async (booking) => {
                const session = await this.sessionRepository.findById(booking.sessionId);
                return {
                    ...booking,
                    session,
                };
            })
        );

        // Sort by session date and filter out past sessions
        const upcomingBookings = enhancedBookings
            .filter(booking => booking.session && new Date(new Date(booking.session.scheduledAt).getTime() + booking.session.duration * 60000) > new Date())
            .sort((a, b) => {
                if (!a.session || !b.session) return 0;
                return new Date(a.session.scheduledAt).getTime() - new Date(b.session.scheduledAt).getTime();
            });

        return upcomingBookings;
    }
}
