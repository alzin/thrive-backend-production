import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";

export class GetCommentByIdUseCase {
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

        return comment;
    }
}