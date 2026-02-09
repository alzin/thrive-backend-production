import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";

export class UpdateCommentUseCase {
    constructor(
        private commentRepository: CommentRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(params: {
        commentId: string;
        content: string;
        userId: string;
    }) {
        const { commentId, content, userId } = params;

        if (!content || content.trim().length === 0) {
            throw new Error('Comment content is required');
        }

        const existingComment = await this.commentRepository.findById(commentId);

        if (!existingComment) {
            throw new Error('Comment not found');
        }

        // Check if user owns the comment
        if (existingComment.userId !== userId) {
            throw new Error('You can only edit your own comments');
        }

        // Update the comment
        existingComment.content = content.trim();
        existingComment.updatedAt = new Date();

        const updatedComment = await this.commentRepository.update(existingComment);

        // Enrich with author information
        const user = await this.userRepository.findById(updatedComment.userId);
        const profile = await this.profileRepository.findByUserId(updatedComment.userId);

        updatedComment.author = {
            userId: updatedComment.userId,
            name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
            email: user?.email || '',
            avatar: profile?.profilePhoto || '',
            level: profile?.level || 1,
        };

        return updatedComment;
    }
}