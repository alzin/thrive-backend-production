import { IAnnouncementRepository } from '../../../domain/repositories/IAnnouncementRepository';
import { AnnouncementLikeRepository } from '../../../infrastructure/database/repositories/AnnouncementLikeRepository';
import { AnnouncementLike } from '../../../domain/entities/AnnouncementLike';

export interface ToggleAnnouncementLikeDTO {
  userId: string;
  announcementId: string;
}

export interface ToggleAnnouncementLikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export class ToggleAnnouncementLikeUseCase {
  constructor(
    private announcementRepository: IAnnouncementRepository,
    private announcementLikeRepository: AnnouncementLikeRepository
  ) {}

  async execute(dto: ToggleAnnouncementLikeDTO): Promise<ToggleAnnouncementLikeResponse> {
    const { userId, announcementId } = dto;

    // Check if announcement exists (pass currentUserId to get isLiked status)
    const announcement = await this.announcementRepository.findById(announcementId, userId);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Check if user already liked the announcement
    const existingLike = await this.announcementLikeRepository.findByUserAndAnnouncement(userId, announcementId);

    if (existingLike) {
      // Unlike the announcement
      await this.announcementLikeRepository.delete(userId, announcementId);
      await this.announcementRepository.decrementLikes(announcementId);
      
      return {
        isLiked: false,
        likesCount: Math.max(0, announcement.likesCount - 1)
      };
    } else {
      // Like the announcement
      const newLike = new AnnouncementLike(
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        userId,
        announcementId,
        new Date()
      );
      
      await this.announcementLikeRepository.create(newLike);
      await this.announcementRepository.incrementLikes(announcementId);
      
      return {
        isLiked: true,
        likesCount: announcement.likesCount + 1
      };
    }
  }
}