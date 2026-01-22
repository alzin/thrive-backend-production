import { GetCommentsUseCase } from '../community/GetCommentsUseCase';
import { CommentRepository } from '../../../infrastructure/database/repositories/CommentRepository';

export interface GetCommentsByFeedbackRequest {
    feedbackId: string;
    currentUserId?: string;
    page: number;
    limit: number;
    includeReplies: boolean;
}

export interface GetCommentsByFeedbackResponse {
    comments: any[];
    pagination: {
        total: number;
        totalWithReplies: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export class GetCommentsByFeedbackUseCase {
    constructor(
        private getCommentsUseCase: GetCommentsUseCase,
        private commentRepository: CommentRepository
    ) { }

    async execute(request: GetCommentsByFeedbackRequest): Promise<GetCommentsByFeedbackResponse> {
        const { feedbackId, currentUserId, page, limit, includeReplies } = request;

        const result = await this.getCommentsUseCase.execute({
            postId: feedbackId, // Using postId field for both posts and feedback
            currentUserId,
            page,
            limit,
            includeReplies
        });

        // Get the total count of ALL comments (including replies) for accurate count
        const totalCommentsIncludingReplies = await this.commentRepository.countByPost(feedbackId);

        return {
            comments: result.comments,
            pagination: {
                total: result.total,
                totalWithReplies: totalCommentsIncludingReplies,
                page: result.page,
                limit,
                totalPages: result.totalPages,
                hasNextPage: result.page < result.totalPages,
                hasPrevPage: result.page > 1
            }
        };
    }
}