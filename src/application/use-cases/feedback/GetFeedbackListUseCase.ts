// backend/src/application/use-cases/feedback/GetFeedbackListUseCase.ts
import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { Feedback } from '../../../domain/entities/Feedback';

export interface GetFeedbackListDTO {
  page?: number;
  limit?: number;
  currentUserId?: string;
}

export interface GetFeedbackListResponse {
  feedback: Feedback[];
  total: number;
  page: number;
  totalPages: number;
}

export class GetFeedbackListUseCase {
  constructor(
    private feedbackRepository: IFeedbackRepository
  ) {}

  async execute(dto: GetFeedbackListDTO): Promise<GetFeedbackListResponse> {
    const { page = 1, limit = 20, currentUserId } = dto;
    const offset = (page - 1) * limit;

    const result = await this.feedbackRepository.findAll(limit, offset, currentUserId);

    return {
      feedback: result.feedback,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }
}