import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";

export interface GetCommentCountRequest {
    postId: string;
}

export interface GetCommentCountResponse {
    count: number;
    topLevelCount: number;
    repliesCount: number;
}

export class GetCommentCountUseCase {
    constructor(private commentRepository: CommentRepository) { }

    async execute(request: GetCommentCountRequest): Promise<GetCommentCountResponse> {
        const { postId } = request;

        const totalCount = await this.commentRepository.countByPost(postId);
        const topLevelCount = await this.commentRepository.countTopLevelByPost(postId);

        return {
            count: totalCount,
            topLevelCount,
            repliesCount: totalCount - topLevelCount
        };
    }
}