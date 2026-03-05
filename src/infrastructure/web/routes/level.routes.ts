import { Router } from 'express';
import { LevelController } from '../controllers/level.controller';
import { authenticate } from '../middleware/auth.middleware';

const levelRouter = (levelController: LevelController): Router => {
  const router = Router();
  router.use(authenticate);

  router.get('/', levelController.getAllLevels.bind(levelController));

  return router;
};

export default levelRouter;
