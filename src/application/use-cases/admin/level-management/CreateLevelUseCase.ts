import { LevelRepository } from "../../../../infrastructure/database/repositories/LevelRepository";
import { Level } from "../../../../domain/entities/Level";

interface CreateLevelInput {
  name: string;
  description?: string;
}

export class CreateLevelUseCase {
  constructor(private readonly levelRepository: LevelRepository) {}

  async execute(input: CreateLevelInput): Promise<Level> {
    const level = new Level(
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      input.name,
      input.description || '',
      new Date()
    );

    return await this.levelRepository.create(level);
  }
}
