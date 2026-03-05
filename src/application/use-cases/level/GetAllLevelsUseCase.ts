import { LevelRepository } from "../../../infrastructure/database/repositories/LevelRepository";

export class GetAllLevelsUseCase {
  constructor(private readonly levelRepository: LevelRepository) {}

  async execute() {
    return await this.levelRepository.findAll();
  }
}
