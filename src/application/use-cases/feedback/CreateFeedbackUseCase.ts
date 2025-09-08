// backend/src/application/use-cases/feedback/CreateFeedbackUseCase.ts
import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { Feedback, IAuthor } from '../../../domain/entities/Feedback';
import { ActivityService } from '../../../infrastructure/services/ActivityService';

export interface CreateFeedbackDTO {
  userId: string;
  content: string;
  mediaUrls?: string[];
}

export class CreateFeedbackUseCase {
  constructor(
    private feedbackRepository: IFeedbackRepository,
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
  ) { }

  async execute(dto: CreateFeedbackDTO): Promise<Feedback> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user profile for author info
    const profile = await this.profileRepository.findByUserId(dto.userId);

    const author: IAuthor = {
      userId: dto.userId,
      name: profile?.name || user.email.split('@')[0] || 'Unknown User',
      email: user.email,
      avatar: profile?.profilePhoto || '',
      level: profile?.level || 0
    };

    const feedback = new Feedback(
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      dto.content,
      dto.mediaUrls || [],
      0,
      author,
      false,
      0,
      new Date(),
      new Date()
    );

    // // Log activity
    // await this.activityService.logFeedbackCreated(dto.userId, feedback.id);

    return await this.feedbackRepository.create(feedback);
  }
}