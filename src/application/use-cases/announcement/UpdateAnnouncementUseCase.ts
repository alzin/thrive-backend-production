import { AnnouncementRepository } from "../../../infrastructure/database/repositories/AnnouncementRepository";

export class UpdateAnnouncementUseCase {
    constructor(
        private announcementRepository: AnnouncementRepository
    ) { }

    async execute(params: {
        announcementId: string;
        content: string;
        userId: string;
        userRole?: string;
    }) {
        const { announcementId, content, userId, userRole } = params;

        const announcement = await this.announcementRepository.findById(announcementId);

        if (!announcement) {
            throw new Error('Announcement not found');
        }

        if (announcement.author.userId !== userId && userRole !== "ADMIN") {
            throw new Error('Not authorized to edit this announcement');
        }

        announcement.content = content;
        announcement.updatedAt = new Date();

        const updatedAnnouncement = await this.announcementRepository.update(announcement);

        if (!updatedAnnouncement) {
            throw new Error('Failed to edit announcement');
        }

        return {
            success: true,
            message: 'Announcement edited successfully',
            announcement: updatedAnnouncement
        };
    }
}