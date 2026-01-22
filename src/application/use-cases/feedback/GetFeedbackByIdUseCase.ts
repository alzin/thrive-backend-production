import { FeedbackRepository } from '../../../infrastructure/database/repositories/FeedbackRepository';

export interface GetFeedbackByIdRequest {
    feedbackId: string;
    userId?: string;
}

export class GetFeedbackByIdUseCase {
    constructor(private feedbackRepository: FeedbackRepository) { }

    async execute(request: GetFeedbackByIdRequest): Promise<any> {
        const { feedbackId, userId } = request;

        const feedback = await this.feedbackRepository.findById(feedbackId, userId);

        if (!feedback) {
            throw new Error("Feedback not found");
        }

        return feedback;
    }
}