import { Router } from 'express';
import { body } from 'express-validator';
import { BookingController } from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

/**
 * Booking Routes
 * 
 * All routes require authentication.
 * 
 * Routes:
 * - POST /bookings - Create a booking (validates plan-based rules)
 * - GET /bookings/my-bookings - Get user's bookings
 * - GET /bookings/limits - Get user's booking limits based on plan
 * - DELETE /bookings/:bookingId - Cancel a booking
 */
const bookingRouter = (bookingController: BookingController): Router => {
  const router = Router();

  router.use(authenticate);

  // Create a new booking
  router.post(
    '/',
    [body('sessionId').notEmpty().withMessage('Session ID is required')],
    validateRequest,
    bookingController.createBooking.bind(bookingController)
  );

  // Get user's bookings
  router.get('/my-bookings', bookingController.getMyBookings.bind(bookingController));

  // Get user's booking limits (active count, monthly count, etc.)
  router.get('/limits', bookingController.getBookingLimits.bind(bookingController));

  // Cancel a booking
  router.delete('/:bookingId', bookingController.cancelBooking.bind(bookingController));

  return router;
};

export default bookingRouter;