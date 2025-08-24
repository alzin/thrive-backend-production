// backend/src/application/use-cases/community/CreatePostUseCase.ts (Updated - Remove isAnnouncement)
import { IPostRepository } from '../../../domain/repositories/IPostRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { Post, IAuthor } from '../../../domain/entities/Post';
import { ActivityService } from '../../../infrastructure/services/ActivityService';

export interface CreatePostDTO {
  userId: string;
  content: string;
  mediaUrls?: string[];
}

export class CreatePostUseCase {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private activityService: ActivityService
  ) { }

  async execute(dto: CreatePostDTO): Promise<Post> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
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

    const post = new Post(
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      author,
      dto.content,
      dto.mediaUrls || [],
      0,
      false,
      new Date(),
      new Date()
    );

    // #activity
    await this.activityService.logPostCreated(dto.userId, post.id);

    return await this.postRepository.create(post);
  }
}