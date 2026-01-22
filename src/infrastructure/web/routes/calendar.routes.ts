import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth.middleware';

const calendarRouter = (calendarController: CalendarController): Router => {
    const router = Router();


    // All calendar routes require authentication
    router.use(authenticate);

    // Get calendar sessions for month/week view
    router.get('/sessions', calendarController.getCalendarSessions.bind(calendarController));

    // Get sessions for a specific day
    router.get('/sessions/day/:date', calendarController.getSessionsByDay.bind(calendarController));

    // Check if user can book a specific session
    router.get('/sessions/:sessionId/eligibility', calendarController.checkBookingEligibility.bind(calendarController));

    // Get user's upcoming bookings
    router.get('/bookings/upcoming', calendarController.getUpcomingBookings.bind(calendarController));

    // Get attendees for a session (for instructors/admins)
    router.get('/sessions/:sessionId/attendees', calendarController.getSessionAttendees.bind(calendarController));


    return router;
};

export default calendarRouter;