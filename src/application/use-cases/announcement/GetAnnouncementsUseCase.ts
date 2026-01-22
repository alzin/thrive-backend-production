import { AnnouncementRepository } from "../../../infrastructure/database/repositories/AnnouncementRepository";

export class GetAnnouncementsUseCase {
    constructor(
        private announcementRepository: AnnouncementRepository
    ) { }

    async execute(params: {
        page: number;
        limit: number;
        userId: string;
    }) {
        const { page, limit, userId } = params;
        const offset = (page - 1) * limit;

        const result = await this.announcementRepository.findAll(limit, offset, userId);

        return {
            announcements: result.announcements,
            total: result.total,
            page,
            totalPages: Math.ceil(result.total / limit)
        };
    }
}