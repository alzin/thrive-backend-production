import { PostRepository } from "../../../infrastructure/database/repositories/PostRepository";
import { S3StorageService } from "../../../infrastructure/services/S3StorageService";

export interface EditPostRequest {
    postId: string;
    userId: string;
    userRole: string;
    content: string;
    mediaUrls?: string[];
    removedMediaUrls?: string[];
}

export class EditPostUseCase {
    constructor(
        private postRepository: PostRepository,
        private storageService: S3StorageService
    ) { }

    async execute(request: EditPostRequest): Promise<any> {
        const { postId, userId, userRole, content, mediaUrls, removedMediaUrls } = request;

        const post = await this.postRepository.findById(postId);

        if (!post) {
            throw new Error("Post not found");
        }

        if (post.author.userId !== userId && userRole !== "ADMIN") {
            throw new Error("Not authorized to edit this post");
        }

        if (removedMediaUrls && removedMediaUrls.length > 0) {
            try {
                await this.storageService.deleteMultipleCommunityMedia(removedMediaUrls);
            } catch (error) {
                console.warn('Failed to delete removed media files:', error);
            }
        }

        post.content = content;
        post.mediaUrls = mediaUrls || [];
        post.updatedAt = new Date();

        const updatedPost = await this.postRepository.update(post);

        if (!updatedPost) {
            throw new Error("Failed to edit post");
        }

        return updatedPost;
    }
}
