import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";

export class GetCommentWithRepliesUseCase {
    constructor(
        private commentRepository: CommentRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(params: {
        commentId: string;
    }) {
        const { commentId } = params;

        const comment = await this.commentRepository.findById(commentId);

        if (!comment) {
            throw new Error('Comment not found');
        }

        // Enrich with author information
        const user = await this.userRepository.findById(comment.userId);
        const profile = await this.profileRepository.findByUserId(comment.userId);

        comment.author = {
            userId: comment.userId,
            name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
            email: user?.email || '',
            avatar: profile?.profilePhoto || '',
            level: profile?.level || 1,
        };

        // Always fetch replies for parent comments
        if (!comment.parentCommentId) {
            const replies = await this.commentRepository.findReplies(commentId);

            const enrichedReplies = await Promise.all(
                replies.map(async (reply) => {
                    const replyUser = await this.userRepository.findById(reply.userId);
                    const replyProfile = await this.profileRepository.findByUserId(reply.userId);

                    reply.author = {
                        userId: reply.userId,
                        name: replyProfile?.name || replyUser?.email?.split('@')[0] || 'Unknown User',
                        email: replyUser?.email || '',
                        avatar: replyProfile?.profilePhoto || '',
                        level: replyProfile?.level || 1,
                    };

                    return reply;
                })
            );

            comment.replies = enrichedReplies;
        }

        return comment;
    }
}