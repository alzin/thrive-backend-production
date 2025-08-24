// backend/src/infrastructure/web/routes/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticate);

// Get dashboard data
router.get('/data', dashboardController.getDashboardData);

export { router as dashboardRouter };