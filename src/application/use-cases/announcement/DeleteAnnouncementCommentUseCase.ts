import { AnnouncementRepository } from "../../../infrastructure/database/repositories/AnnouncementRepository";
import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";

export class DeleteAnnouncementCommentUseCase {
    constructor(
        private commentRepository: CommentRepository,
        private announcementRepository: AnnouncementRepository
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

        if (existingComment.userId !== userId) {
            throw new Error('You can only delete your own comments');
        }

        const deleted = await this.commentRepository.delete(commentId);

        if (!deleted) {
            throw new Error('Failed to delete comment');
        }

        // Update announcement comment count
        const newTotalCommentCount = await this.commentRepository.countByPost(existingComment.postId);
        const announcement = await this.announcementRepository.findById(existingComment.postId);

        if (announcement) {
            announcement.commentsCount = newTotalCommentCount;
            await this.announcementRepository.update(announcement);
        }

        return {
            success: true,
            message: 'Comment deleted successfully',
            newCommentsCount: newTotalCommentCount
        };
    }
}