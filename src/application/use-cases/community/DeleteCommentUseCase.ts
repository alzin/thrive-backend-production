import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";

export interface DeleteCommentRequest {
    commentId: string;
    userId: string;
}

export class DeleteCommentUseCase {
    constructor(private commentRepository: CommentRepository) { }

    async execute(request: DeleteCommentRequest): Promise<void> {
        const { commentId, userId } = request;

        const existingComment = await this.commentRepository.findById(commentId);

        if (!existingComment) {
            throw new Error("Comment not found");
        }

        if (existingComment.userId !== userId) {
            throw new Error("You can only delete your own comments");
        }

        const deleted = await this.commentRepository.delete(commentId);

        if (!deleted) {
            throw new Error("Failed to delete comment");
        }
    }
}