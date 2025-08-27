import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export interface MarkTourVideoViewedDTO {
  userId: string;
}

export class MarkTourVideoViewedUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: MarkTourVideoViewedDTO): Promise<boolean> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 🎯 MARK TOUR AS VIEWED - PREVENTS FUTURE AUTO-SHOWS
    user.hasSeedTourVideo = true;
    await this.userRepository.update(user);
    
    return true;
  }
}