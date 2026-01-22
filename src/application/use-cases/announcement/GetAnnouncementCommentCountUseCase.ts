import { CommentRepository } from "../../../infrastructure/database/repositories/CommentRepository";

export class GetAnnouncementCommentCountUseCase {
    constructor(
        private commentRepository: CommentRepository
    ) { }

    async execute(params: {
        announcementId: string;
    }) {
        const { announcementId } = params;

        const totalCount = await this.commentRepository.countByPost(announcementId);
        const topLevelCount = await this.commentRepository.countTopLevelByPost(announcementId);

        return {
            count: totalCount,
            topLevelCount,
            repliesCount: totalCount - topLevelCount
        };
    }
}
