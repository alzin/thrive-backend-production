import { PostRepository } from '../../../infrastructure/database/repositories/PostRepository';

export interface GetPostsRequest {
    userId: string;
    page?: number;
    limit?: number;
}

export interface GetPostsResponse {
    posts: any[];
    total: number;
    page: number;
    totalPages: number;
}

export class GetPostsUseCase {
    constructor(private postRepository: PostRepository) { }

    async execute(request: GetPostsRequest): Promise<GetPostsResponse> {
        const { userId, page = 1, limit = 20 } = request;

        const offset = (page - 1) * limit;
        const result = await this.postRepository.findAll(limit, offset, userId);

        return {
            posts: result.posts,
            total: result.total,
            page,
            totalPages: Math.ceil(result.total / limit)
        };
    }
}