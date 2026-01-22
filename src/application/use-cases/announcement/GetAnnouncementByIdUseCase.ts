import { AnnouncementRepository } from "../../../infrastructure/database/repositories/AnnouncementRepository";

export class GetAnnouncementByIdUseCase {
    constructor(
        private announcementRepository: AnnouncementRepository
    ) { }

    async execute(params: {
        announcementId: string;
        userId: string;
    }) {
        const { announcementId, userId } = params;

        const announcement = await this.announcementRepository.findById(announcementId, userId);

        if (!announcement) {
            throw new Error('Announcement not found');
        }

        return announcement;
    }
}