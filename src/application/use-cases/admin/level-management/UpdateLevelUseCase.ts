import { LevelRepository } from "../../../../infrastructure/database/repositories/LevelRepository";

export class UpdateLevelUseCase {
  constructor(private readonly levelRepository: LevelRepository) {}

  async execute(levelId: string, updates: any) {
    const level = await this.levelRepository.findById(levelId);
    if (!level) {
      throw new Error('Level not found');
    }
    Object.assign(level, updates);
    return await this.levelRepository.update(level);
  }
}
