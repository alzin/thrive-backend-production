// backend/src/infrastructure/web/routes/publicProfile.routes.ts
import { Router } from 'express';
import { PublicProfileController } from '../controllers/publicProfile.controller';

const publicProfileRouter = (publicProfileController: PublicProfileController): Router => {
    const router = Router();


    // Public profile route - no authentication required
    router.get('/:userId', publicProfileController.getPublicProfile.bind(publicProfileController));

    return router;
};

export default publicProfileRouter;

