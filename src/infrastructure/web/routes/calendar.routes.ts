import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const calendarController = new CalendarController();

// All calendar routes require authentication
router.use(authenticate);

// Get calendar sessions for month/week view
router.get('/sessions', calendarController.getCalendarSessions);

// Get sessions for a specific day
router.get('/sessions/day/:date', calendarController.getSessionsByDay);

// Check if user can book a specific session
router.get('/sessions/:sessionId/eligibility', calendarController.checkBookingEligibility);

// Get user's upcoming bookings
router.get('/bookings/upcoming', calendarController.getUpcomingBookings);

// Get attendees for a session (for instructors/admins)
router.get('/sessions/:sessionId/attendees', calendarController.getSessionAttendees);

export { router as calendarRouter };