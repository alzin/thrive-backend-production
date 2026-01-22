import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";
import { GetCommentsUseCase } from "../community/GetCommentsUseCase";

export class GetCommentsByPostUseCase {
    constructor(
        private getCommentsUseCase: GetCommentsUseCase,
        private commentRepository: CommentRepository
    ) { }

    async execute(params: {
        postId: string;
        currentUserId?: string;
        userRole?: string;
        page: number;
        limit: number;
        includeReplies: boolean;
    }) {
        const { postId, currentUserId, userRole, page, limit, includeReplies } = params;

        const result = await this.getCommentsUseCase.execute({
            postId,
            currentUserId,
            page,
            limit,
            includeReplies
        });

        // Backend enhancement: Add metadata to help frontend handle editing states
        const enhancedComments = result.comments.map(comment => ({
            ...comment,
            // Add server-side flags for better state management
            canEdit: comment.author?.userId === currentUserId,
            canDelete: comment.author?.userId === currentUserId || userRole === 'ADMIN',
            hasReplies: comment.replies && comment.replies.length > 0,
            // Ensure replies are always included for parent comments
            replies: comment.replies || []
        }));

        // Get the total count of ALL comments (including replies) for accurate count
        const totalCommentsIncludingReplies = await this.commentRepository.countByPost(postId);

        return {
            success: true,
            data: {
                comments: enhancedComments,
                pagination: {
                    total: result.total,
                    totalWithReplies: totalCommentsIncludingReplies,
                    page: result.page,
                    limit,
                    totalPages: result.totalPages,
                    hasNextPage: result.page < result.totalPages,
                    hasPrevPage: result.page > 1
                }
            }
        };
    }
}