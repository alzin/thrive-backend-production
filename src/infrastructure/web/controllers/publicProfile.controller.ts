// backend/src/infrastructure/web/controllers/publicProfile.controller.ts - Updated with Dependency Injection
import { Request, Response, NextFunction } from 'express';

// Use Cases
import { GetPublicProfileUseCase } from '../../../application/use-cases/publicProfile/GetPublicProfileUseCase';

export class PublicProfileController {
  constructor(
    private getPublicProfileUseCase: GetPublicProfileUseCase
  ) { }

  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const publicProfileData = await this.getPublicProfileUseCase.execute({ userId });

      res.json(publicProfileData);
    } catch (error) {
      if (error instanceof Error && error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
}