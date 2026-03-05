import { LevelRepository } from "../../../../infrastructure/database/repositories/LevelRepository";

export class DeleteLevelUseCase {
  constructor(private readonly levelRepository: LevelRepository) {}

  async execute(levelId: string) {
    const deleted = await this.levelRepository.delete(levelId);
    if (!deleted) {
      throw new Error('Level not found');
    }
    return { message: 'Level deleted successfully' };
  }
}
