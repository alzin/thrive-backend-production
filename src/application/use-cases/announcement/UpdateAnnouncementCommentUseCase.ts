// backend/src/application/use-cases/announcement/UpdateAnnouncementCommentUseCase.ts

import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { Comment } from "../../../domain/entities/Comment";

interface UpdateAnnouncementCommentInput {
    commentId: string;
    userId: string;
    content: string;
}

interface UpdateAnnouncementCommentOutput {
    id: string;
    postId: string;
    userId: string;
    content: string;
    parentCommentId: string | undefined;
    createdAt: Date;
    updatedAt: Date;
    author: {
        userId: string;
        name: string;
        email: string;
        avatar: string;
        level: number;
    };
}

export class UpdateAnnouncementCommentUseCase {
    constructor(
        private commentRepository: CommentRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(input: UpdateAnnouncementCommentInput): Promise<UpdateAnnouncementCommentOutput> {
        const { commentId, userId, content } = input;

        // Validate content
        if (!content || content.trim().length === 0) {
            throw new Error("Comment content is required");
        }

        // Find existing comment
        const existingComment = await this.commentRepository.findById(commentId);
        if (!existingComment) {
            throw new Error("Comment not found");
        }

        // Check ownership
        if (existingComment.userId !== userId) {
            throw new Error("You can only edit your own comments");
        }

        // Update comment
        existingComment.content = content.trim();
        existingComment.updatedAt = new Date();

        const updatedComment = await this.commentRepository.update(existingComment);
        if (!updatedComment) {
            throw new Error("Failed to update comment");
        }

        // Fetch user and profile data
        const user = await this.userRepository.findById(userId);
        const profile = await this.profileRepository.findByUserId(userId);

        if (!user) {
            throw new Error("User data not found");
        }

        // Return formatted response
        return {
            id: updatedComment.id,
            postId: updatedComment.postId,
            userId: updatedComment.userId,
            content: updatedComment.content,
            parentCommentId: updatedComment.parentCommentId,
            createdAt: updatedComment.createdAt,
            updatedAt: updatedComment.updatedAt,
            author: {
                userId: user.id,
                name: profile?.name || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                avatar: profile?.profilePhoto || '',
                level: profile?.level || 1
            }
        };
    }
}