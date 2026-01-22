import { BookingRepository } from "../../../infrastructure/database/repositories/BookingRepository";
import { SessionRepository } from "../../../infrastructure/database/repositories/SessionRepository";

export class GetSessionsByDayUseCase {
    constructor(
        private sessionRepository: SessionRepository,
        private bookingRepository: BookingRepository
    ) { }

    async execute(params: {
        date: string;
        userId: string;
    }) {
        const { date, userId } = params;
        const targetDate = new Date(date);

        // Get sessions for specific day
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const sessions = await this.sessionRepository.findByDateRange(startOfDay, endOfDay);

        // Get user's bookings
        const userBookings = await this.bookingRepository.findActiveByUserId(userId);
        const bookedSessionIds = userBookings.map(b => b.sessionId);

        const enhancedSessions = sessions.map(session => ({
            ...session,
            isBooked: bookedSessionIds.includes(session.id),
            participantsList: [], // In production, you'd fetch actual participants
        }));

        return enhancedSessions;
    }
}