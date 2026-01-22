// backend/src/infrastructure/web/routes/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const dashboardRouter = (dashboardController: DashboardController): Router => {
    const router = Router();


    // All dashboard routes require authentication
    router.use(authenticate);

    // Get dashboard data
    router.get('/data', dashboardController.getDashboardData.bind(dashboardController));

    return router;
};

export default dashboardRouter;


