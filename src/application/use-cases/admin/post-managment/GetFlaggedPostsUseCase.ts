import { PostRepository } from "../../../../infrastructure/database/repositories/PostRepository";

export class GetFlaggedPostsUseCase {
    constructor(
        private readonly postRepository: PostRepository
    ) { }

    async execute() {
        const { posts } = await this.postRepository.findAll();
        // In production, filter by flagged status
        // return posts.filter(post => post.isFlagged);
        return posts;
    }
}