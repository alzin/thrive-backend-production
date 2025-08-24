// backend/src/infrastructure/web/routes/publicProfile.routes.ts
import { Router } from 'express';
import { PublicProfileController } from '../controllers/publicProfile.controller';

const router = Router();
const publicProfileController = new PublicProfileController();

// Public profile route - no authentication required
router.get('/:userId', publicProfileController.getPublicProfile.bind(publicProfileController));

export { router as publicProfileRouter };