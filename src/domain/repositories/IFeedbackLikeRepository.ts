// backend/src/domain/repositories/IFeedbackLikeRepository.ts
import { FeedbackLike } from "../entities/FeedbackLike";

export interface IFeedbackLikeRepository {
  create(feedbackLike: FeedbackLike): Promise<FeedbackLike>;
  findByUserAndFeedback(userId: string, feedbackId: string): Promise<FeedbackLike | null>;
  findByFeedback(feedbackId: string): Promise<FeedbackLike[]>;
  findByUser(userId: string): Promise<FeedbackLike[]>;
  delete(userId: string, feedbackId: string): Promise<boolean>;
  countByFeedback(feedbackId: string): Promise<number>;
  findLikedFeedbackByUser(userId: string, feedbackIds: string[]): Promise<string[]>;
}