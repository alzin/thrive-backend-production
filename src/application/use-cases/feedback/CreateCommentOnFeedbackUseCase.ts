import { CreateCommentUseCase } from '../community/CreateCommentUseCase';

export interface CreateCommentOnFeedbackRequest {
    feedbackId: string;
    userId: string;
    content: string;
    parentCommentId?: string;
}

export class CreateCommentOnFeedbackUseCase {
    constructor(private createCommentUseCase: CreateCommentUseCase) { }

    async execute(request: CreateCommentOnFeedbackRequest): Promise<any> {
        const { feedbackId, userId, content, parentCommentId } = request;

        if (!content || content.trim().length === 0) {
            throw new Error("Comment content is required");
        }

        return await this.createCommentUseCase.execute({
            userId,
            postId: feedbackId, // Using postId field for both posts and feedback
            content: content.trim(),
            parentCommentId
        });
    }
}
