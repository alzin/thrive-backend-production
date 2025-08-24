// backend/src/application/use-cases/announcement/CreateAnnouncementUseCase.ts
import { IAnnouncementRepository } from '../../../domain/repositories/IAnnouncementRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { Announcement, IAuthor } from '../../../domain/entities/Announcement';
import { UserRole } from '../../../domain/entities/User';
import { ActivityService } from '../../../infrastructure/services/ActivityService';

export interface CreateAnnouncementDTO {
  userId: string;
  content: string;
}

export class CreateAnnouncementUseCase {
  constructor(
    private announcementRepository: IAnnouncementRepository,
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private activityService: ActivityService
  ) { }

  async execute(dto: CreateAnnouncementDTO): Promise<Announcement> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Only admins can create announcements
    if (user.role !== UserRole.ADMIN) {
      throw new Error('Only admins can create announcements');
    }

    // Get user profile for author info
    const profile = await this.profileRepository.findByUserId(dto.userId);

    const author: IAuthor = {
      userId: dto.userId,
      name: profile?.name || user.email.split('@')[0] || 'Unknown User',
      email: user.email,
      avatar: profile?.profilePhoto || '',
      level: profile?.level || 0
    };

    const announcement = new Announcement(
      `announcement_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      author,
      dto.content,
      0,
      false,
      new Date(),
      new Date()
    );

    // Log activity
    await this.activityService.logPostCreated(dto.userId, announcement.id); // Reuse post activity logging

    return await this.announcementRepository.create(announcement);
  }
}