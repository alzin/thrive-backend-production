import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export interface CheckTourVideoStatusDTO {
  userId: string;
}

export interface TourVideoStatus {
  hasSeenTour: boolean;
  shouldShowTour: boolean;
}

export class CheckTourVideoStatusUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: CheckTourVideoStatusDTO): Promise<TourVideoStatus> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const hasSeenTour = user.hasSeedTourVideo || false;
    const shouldShowTour = !hasSeenTour; // 🎯 TRUE FOR FIRST-TIME USERS!

    return {
      hasSeenTour,
      shouldShowTour // This triggers auto-show modal for new users
    };
  }
}