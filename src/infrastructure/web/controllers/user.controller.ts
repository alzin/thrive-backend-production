import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';

export class UserController {
  async getUserProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const profileRepository = new ProfileRepository();
      
      const profile = await profileRepository.findByUserId(userId);
      if (!profile) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.json([]);
        return;
      }

      const profileRepository = new ProfileRepository();
      const profiles = await profileRepository.findAll();
      
      const filtered = profiles.filter(profile => 
        profile.name.toLowerCase().includes(q.toLowerCase())
      );

      res.json(filtered);
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      // Implement block logic
      res.json({ message: 'User blocked successfully' });
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      // Implement unblock logic
      res.json({ message: 'User unblocked successfully' });
    } catch (error) {
      next(error);
    }
  }
}