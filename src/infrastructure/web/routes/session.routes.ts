import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const sessionController = new SessionController();

// All session routes require authentication
router.use(authenticate);

// Get upcoming sessions
router.get('/upcoming', sessionController.getUpcomingSessions);

// Get all sessions with pagination
router.get('/', sessionController.getAllSessions);

// Get session by ID
router.get('/:sessionId', sessionController.getSessionById);

// Get sessions by date range
router.get('/range', sessionController.getSessionsByDateRange);

export { router as sessionRouter };