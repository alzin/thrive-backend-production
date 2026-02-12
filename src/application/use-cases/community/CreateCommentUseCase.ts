import { Comment } from "../../../domain/entities/Comment";
import { ICommentRepository } from "../../../domain/repositories/ICommentRepository";
import { IProfileRepository } from "../../../domain/repositories/IProfileRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ICommentableRepository } from "../../../domain/repositories/ICommentableRepository";
import { ISubscriptionRepository } from "../../../domain/repositories/ISubscriptionRepository";

export interface CreateCommentDTO {
  userId: string;
  postId: string;
  content: string;
  parentCommentId?: string;
}

export class CreateCommentUseCase {
  constructor(
    private commentRepository: ICommentRepository,
    private commentableRepository: ICommentableRepository,
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private subscriptionRepository: ISubscriptionRepository
  ) { }

  async execute(dto: CreateCommentDTO): Promise<Comment> {
    // Get user first to check free trial status
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is in free trial (no subscription, but has trial dates set)
    const now = new Date();
    const isInFreeTrial = user.trialStartDate !== null &&
      user.trialEndDate !== null &&
      now < user.trialEndDate;

    // 1. Subscription Check (Priority) - Skip if user is in free trial or is admin
    const subscription = await this.subscriptionRepository.findActiveByUserId(dto.userId);

    if (subscription && subscription.status === 'canceled' && user.role !== 'ADMIN') {
      throw new Error('Your subscription is canceled. You cannot post comments.');
    }

    // Allow commenting if user has active subscription OR is in free trial OR is admin
    const hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.status);
    if (!hasActiveSubscription && !isInFreeTrial && user.role !== 'ADMIN') {
      throw new Error('Active subscription required to comment.');
    }

    // 2. Validate post/announcement exists
    const commentableItem = await this.commentableRepository.findById(dto.postId);
    if (!commentableItem) {
      throw new Error('Post or announcement not found');
    }

    // 3. Get user profile
    const profile = await this.profileRepository.findByUserId(dto.userId);

    // 4. If it's a reply, validate parent comment exists
    let parentComment = null;
    if (dto.parentCommentId) {
      parentComment = await this.commentRepository.findById(dto.parentCommentId);
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }

      if (parentComment.postId !== dto.postId) {
        throw new Error("Parent comment does not belong to this post or announcement");
      }
    }

    // 5. Create optimized author info object
    const author = {
      userId: dto.userId,
      name: profile?.name || user.email.split("@")[0] || 'Unknown User',
      email: user.email,
      avatar: profile?.profilePhoto || "",
      level: profile?.level || 1
    };

    // 6. Generate optimized comment ID
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const comment = new Comment(
      commentId,
      dto.postId,
      dto.userId,
      dto.content.trim(),
      dto.parentCommentId,
      author,
      new Date(),
      new Date(),
      []
    );

    const savedComment = await this.commentRepository.create(comment);

    return {
      ...savedComment,
      author: author,
      replies: []
    };
  }
}