// backend/src/infrastructure/web/controllers/user.controller.ts - Updated with Dependency Injection
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { GetUserProfileUseCase } from '../../../application/use-cases/user/GetUserProfileUseCase';
import { SearchUsersUseCase } from '../../../application/use-cases/user/SearchUsersUseCase';
import { BlockUserUseCase } from '../../../application/use-cases/user/BlockUserUseCase';
import { UnblockUserUseCase } from '../../../application/use-cases/user/UnblockUserUseCase';

export class UserController {
  constructor(
    private getUserProfileUseCase: GetUserProfileUseCase,
    private searchUsersUseCase: SearchUsersUseCase,
    private blockUserUseCase: BlockUserUseCase,
    private unblockUserUseCase: UnblockUserUseCase
  ) { }

  async getUserProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const profile = await this.getUserProfileUseCase.execute({ userId });

      res.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async searchUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;

      const profiles = await this.searchUsersUseCase.execute({
        query: String(q || '')
      });

      res.json(profiles);
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      await this.blockUserUseCase.execute({ userId });

      res.json({ message: 'User blocked successfully' });
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      await this.unblockUserUseCase.execute({ userId });

      res.json({ message: 'User unblocked successfully' });
    } catch (error) {
      next(error);
    }
  }
}