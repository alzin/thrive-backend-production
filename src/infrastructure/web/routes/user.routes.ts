import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const userRouter = (userController: UserController): Router => {
    const router = Router();

    router.use(authenticate);

    router.get('/profile/:userId', userController.getUserProfile.bind(userController));
    router.get('/search', userController.searchUsers.bind(userController));
    router.post('/block/:userId', userController.blockUser.bind(userController));
    router.post('/unblock/:userId', userController.unblockUser.bind(userController));

    return router;
};

export default userRouter;