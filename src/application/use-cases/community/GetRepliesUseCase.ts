import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";

export interface GetRepliesRequest {
    commentId: string;
}

export class GetRepliesUseCase {
    constructor(
        private commentRepository: CommentRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(request: GetRepliesRequest): Promise<any[]> {
        const { commentId } = request;

        const replies = await this.commentRepository.findReplies(commentId);

        const enrichedReplies = await Promise.all(
            replies.map(async (reply) => {
                const user = await this.userRepository.findById(reply.userId);
                const profile = await this.profileRepository.findByUserId(reply.userId);

                reply.author = {
                    userId: reply.userId,
                    name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
                    email: user?.email || '',
                    avatar: profile?.profilePhoto || '',
                    level: profile?.level || 1,
                };

                return reply;
            })
        );

        return enrichedReplies;
    }
}
