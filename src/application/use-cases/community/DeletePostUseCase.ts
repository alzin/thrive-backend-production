import { PostRepository } from '../../../infrastructure/database/repositories/PostRepository';
import { UserRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { S3StorageService } from '../../../infrastructure/services/S3StorageService';

export interface DeletePostRequest {
    postId: string;
    userId: string;
    userRole: string;
}

export class DeletePostUseCase {
    constructor(
        private postRepository: PostRepository,
        private userRepository: UserRepository,
        private storageService: S3StorageService
    ) { }

    async execute(request: DeletePostRequest): Promise<void> {
        const { postId, userId, userRole } = request;

        const post = await this.postRepository.findById(postId);

        if (!post) {
            throw new Error("Post not found");
        }

        if (post.author?.userId !== userId && userRole !== "ADMIN") {
            throw new Error("Not authorized to delete this post");
        }

        if (post.mediaUrls && post.mediaUrls.length > 0) {
            try {
                await this.storageService.deleteMultipleCommunityMedia(post.mediaUrls);
            } catch (error) {
                console.warn('Failed to delete media files:', error);
            }
        }

        const deleted = await this.postRepository.delete(postId);
        if (!deleted) {
            throw new Error('Failed to delete post');
        }
    }
}