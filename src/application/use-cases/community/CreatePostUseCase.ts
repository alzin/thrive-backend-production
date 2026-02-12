import { IPostRepository } from '../../../domain/repositories/IPostRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { ISubscriptionRepository } from '../../../domain/repositories/ISubscriptionRepository';
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
    private subscriptionRepository: ISubscriptionRepository,
    private activityService: ActivityService
  ) { }

  async execute(dto: CreatePostDTO): Promise<Post> {
    // Get user first to check free trial status
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is in free trial (no subscription, but has trial dates set)
    const now = new Date();
    const isInFreeTrial = user.trialStartDate !== null &&
      user.trialEndDate !== null &&
      now < user.trialEndDate;

    // 1. Subscription Check (Priority) - Skip if user is in free trial
    const subscription = await this.subscriptionRepository.findActiveByUserId(dto.userId);

    // Strict check: Must allow 'active' or 'trialing'. Explicitly block 'canceled'.
    if (subscription && subscription.status === 'canceled') {
      throw new Error('Your subscription is canceled. You cannot create posts.');
    }

    // Allow posting if user has active subscription OR is in free trial OR Admin
    const hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.status);
    if (!hasActiveSubscription && !isInFreeTrial && user.role !== 'ADMIN') {
      throw new Error('Active subscription required to post in the community.');
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