import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { SessionRepository } from '../../../infrastructure/database/repositories/SessionRepository';
import { BookingRepository } from '../../../infrastructure/database/repositories/BookingRepository';

export class GetCalendarSessionsUseCase {
    constructor(
        private sessionRepository: SessionRepository,
        private bookingRepository: BookingRepository
    ) { }

    async execute(params: {
        year?: string;
        month?: string;
        week?: string;
        view?: string;
        userId: string;
    }) {
        const { year, month, view = 'month', week, userId } = params;

        let startDate: Date;
        let endDate: Date;

        if (view === 'month' && year && month) {
            const date = new Date(Number(year), Number(month) - 1);
            startDate = startOfMonth(date);
            endDate = endOfMonth(date);
        } else if (view === 'week') {
            const date = week ? new Date(String(week)) : new Date();
            startDate = startOfWeek(date);
            endDate = endOfWeek(date);
        } else {
            // Default to current month
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        }

        // Get active sessions in date range
        const sessions = await this.sessionRepository.findByDateRange(startDate, endDate);

        // Get user's bookings
        const userBookings = await this.bookingRepository.findActiveByUserId(userId);
        const bookedSessionIds = userBookings.map(b => b.sessionId);

        // Enhance sessions with booking status
        const enhancedSessions = sessions.map(session => ({
            ...session,
            isBooked: bookedSessionIds.includes(session.id),
            canBook: session.canBook() && userBookings.length < 2 && !bookedSessionIds.includes(session.id),
        }));

        return {
            sessions: enhancedSessions,
            dateRange: { start: startDate, end: endDate },
            userBookingCount: userBookings.length,
        };
    }
}