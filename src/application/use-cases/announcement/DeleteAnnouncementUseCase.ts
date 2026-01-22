import { AnnouncementRepository } from "../../../infrastructure/database/repositories/AnnouncementRepository";

export class DeleteAnnouncementUseCase {
    constructor(
        private announcementRepository: AnnouncementRepository
    ) { }

    async execute(params: {
        announcementId: string;
        userId: string;
        userRole?: string;
    }) {
        const { announcementId, userId, userRole } = params;

        const announcement = await this.announcementRepository.findById(announcementId);

        if (!announcement) {
            throw new Error('Announcement not found');
        }

        if (announcement.author?.userId !== userId && userRole !== "ADMIN") {
            throw new Error('Not authorized to delete this announcement');
        }

        const deleted = await this.announcementRepository.delete(announcementId);

        if (!deleted) {
            throw new Error('Failed to delete announcement');
        }

        return { success: true, message: 'Announcement deleted successfully' };
    }
}
