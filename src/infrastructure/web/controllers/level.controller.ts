import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GetAllLevelsUseCase } from '../../../application/use-cases/level/GetAllLevelsUseCase';

export class LevelController {
  constructor(
    private readonly getAllLevelsUseCase: GetAllLevelsUseCase
  ) {}

  async getAllLevels(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const levels = await this.getAllLevelsUseCase.execute();
      res.json(levels);
    } catch (error) {
      next(error);
    }
  }
}
