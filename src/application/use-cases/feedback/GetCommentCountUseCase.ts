import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";

export interface GetCommentCountRequest {
    feedbackId: string;
}

export interface GetCommentCountResponse {
    count: number;
    topLevelCount: number;
    repliesCount: number;
}

export class GetCommentCountUseCase {
    constructor(private commentRepository: CommentRepository) { }

    async execute(request: GetCommentCountRequest): Promise<GetCommentCountResponse> {
        const { feedbackId } = request;

        // Get total count including all replies
        const totalCount = await this.commentRepository.countByPost(feedbackId);

        // Optionally also get top-level count
        const topLevelCount = await this.commentRepository.countTopLevelByPost(feedbackId);

        return {
            count: totalCount,
            topLevelCount,
            repliesCount: totalCount - topLevelCount
        };
    }
}
