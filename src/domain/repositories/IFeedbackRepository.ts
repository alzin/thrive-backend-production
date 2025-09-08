import { Feedback } from "../entities/Feedback";

export interface IFeedbackRepository {
  create(feedback: Feedback): Promise<Feedback>
  update(feedback: Feedback): Promise<Feedback>
  delete(id: string): Promise<boolean>
  findById(id: string, currentUserId?: string): Promise<Feedback | null>
  findAll(limit?: number, offset?: number, currentUserId?: string): Promise<{ feedback: Feedback[]; total: number }>;
  incrementLikes(id: string): Promise<Feedback | null>;
  decrementLikes(id: string): Promise<Feedback | null>;
}