import { IVideoRepository } from '../../../domain/repositories/IVideoRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { Video, VideoType } from '../../../domain/entities/Video';
import { UserRole } from '../../../domain/entities/User';

export interface CreateOrUpdateVideoDTO {
  userId: string;
  // title: string;
  description: string;
  videoUrl: string;
  videoType: VideoType;
  thumbnailUrl?: string;
  // duration?: number;
  isActive?: boolean;
}

export class CreateOrUpdateVideoUseCase {
  constructor(
    private videoRepository: IVideoRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: CreateOrUpdateVideoDTO): Promise<Video> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new Error('Only admins can manage videos');
    }

    const existingVideo = await this.videoRepository.findFirst();

    const video = new Video(
      existingVideo ? existingVideo.id : `video_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      // dto.title,
      dto.description,
      dto.videoUrl,
      dto.videoType,
      dto.thumbnailUrl,
      // dto.duration,
      dto.isActive ?? true,
      dto.userId,
      existingVideo ? existingVideo.createdAt : new Date(),
      new Date()
    );

    if (!video.isValidUrl()) {
      throw new Error('Invalid video URL for the specified type');
    }

    if (video.videoType === VideoType.YOUTUBE && !video.thumbnailUrl) {
      video.thumbnailUrl = video.getYouTubeThumbnail() || undefined;
    }

    if (existingVideo) {
      return await this.videoRepository.update(video);
    } else {
      return await this.videoRepository.create(video);
    }
  }
}
