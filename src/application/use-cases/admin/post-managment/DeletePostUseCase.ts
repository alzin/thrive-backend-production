import { PostRepository } from "../../../../infrastructure/database/repositories/PostRepository";

export class DeletePostUseCase {
    constructor(
        private readonly postRepository: PostRepository
    ) { }

    async execute(postId: string) {
        const deleted = await this.postRepository.delete(postId);

        if (!deleted) {
            throw new Error('Post not found');
        }

        return { message: 'Post deleted successfully' };
    }
}