import { Router } from 'express';
import { body } from 'express-validator';
import { BookingController } from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const bookingController = new BookingController();

router.use(authenticate);

router.post(
  '/',
  [body('sessionId').notEmpty()],
  validateRequest,
  bookingController.createBooking
);

router.get('/my-bookings', bookingController.getMyBookings);
router.delete('/:bookingId', bookingController.cancelBooking);

export { router as bookingRouter };
