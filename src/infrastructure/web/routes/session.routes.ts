import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { authenticate } from '../middleware/auth.middleware';

const sessionRouter = (sessionController: SessionController): Router => {
    const router = Router();


    // All session routes require authentication
    router.use(authenticate);

    // Get upcoming sessions
    router.get('/upcoming', sessionController.getUpcomingSessions.bind(sessionController));

    // Get all sessions with pagination
    router.get('/', sessionController.getAllSessions.bind(sessionController));

    // Get session by ID
    router.get('/:sessionId', sessionController.getSessionById.bind(sessionController));

    // Get sessions by date range
    router.get('/range', sessionController.getSessionsByDateRange.bind(sessionController));

    return router;
};

export default sessionRouter;
