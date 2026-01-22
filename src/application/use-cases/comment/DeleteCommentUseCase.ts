import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";

export class DeleteCommentUseCase {
    constructor(
        private commentRepository: CommentRepository
    ) { }

    async execute(params: {
        commentId: string;
        userId: string;
    }) {
        const { commentId, userId } = params;

        const existingComment = await this.commentRepository.findById(commentId);

        if (!existingComment) {
            throw new Error('Comment not found');
        }

        // Check if user owns the comment
        if (existingComment.userId !== userId) {
            throw new Error('You can only delete your own comments');
        }

        const deleted = await this.commentRepository.delete(commentId);

        if (!deleted) {
            throw new Error('Failed to delete comment');
        }

        return {
            success: true,
            message: 'Comment deleted successfully'
        };
    }
}