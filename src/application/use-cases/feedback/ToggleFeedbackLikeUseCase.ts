// backend/src/application/use-cases/feedback/ToggleFeedbackLikeUseCase.ts
import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { FeedbackLikeRepository } from '../../../infrastructure/database/repositories/FeedbackLikeRepository';
import { FeedbackLike } from '../../../domain/entities/FeedbackLike';

export interface ToggleFeedbackLikeDTO {
  userId: string;
  feedbackId: string;
}

export interface ToggleFeedbackLikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export class ToggleFeedbackLikeUseCase {
  constructor(
    private feedbackRepository: IFeedbackRepository,
    private feedbackLikeRepository: FeedbackLikeRepository
  ) {}

  async execute(dto: ToggleFeedbackLikeDTO): Promise<ToggleFeedbackLikeResponse> {
    const { userId, feedbackId } = dto;

    // Check if feedback exists
    const feedback = await this.feedbackRepository.findById(feedbackId, userId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    // Check if user already liked the feedback
    const existingLike = await this.feedbackLikeRepository.findByUserAndFeedback(userId, feedbackId);

    if (existingLike) {
      // Unlike the feedback
      await this.feedbackLikeRepository.delete(userId, feedbackId);
      await this.feedbackRepository.decrementLikes(feedbackId);
      
      return {
        isLiked: false,
        likesCount: Math.max(0, feedback.likesCount - 1)
      };
    } else {
      // Like the feedback
      const newLike = new FeedbackLike(
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        userId,
        feedbackId,
        new Date()
      );
      
      await this.feedbackLikeRepository.create(newLike);
      await this.feedbackRepository.incrementLikes(feedbackId);
      
      return {
        isLiked: true,
        likesCount: feedback.likesCount + 1
      };
    }
  }
}