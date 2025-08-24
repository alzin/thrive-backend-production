import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get('/profile/:userId', userController.getUserProfile);
router.get('/search', userController.searchUsers);
router.post('/block/:userId', userController.blockUser);
router.post('/unblock/:userId', userController.unblockUser);

export { router as userRouter };
