import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";

export class GetCommentCountUseCase {
    constructor(
        private commentRepository: CommentRepository
    ) { }

    async execute(params: {
        postId: string;
    }) {
        const { postId } = params;

        const count = await this.commentRepository.countByPost(postId);

        return { count };
    }
}