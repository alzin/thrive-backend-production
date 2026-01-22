// backend/src/infrastructure/database/repositories/FeedbackRepository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { FeedbackEntity } from '../entities/Feedback.entity';
import { UserEntity } from '../entities/User.entity';
import { ProfileEntity } from '../entities/Profile.entity';
import { CommentEntity } from '../entities/Comment.entity';
import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { Feedback, IAuthor } from '../../../domain/entities/Feedback';
import { FeedbackLikeRepository } from './FeedbackLikeRepository';
import { ICommentableRepository } from '../../../domain/repositories/ICommentableRepository';

export class FeedbackRepository implements IFeedbackRepository, ICommentableRepository {
  private repository: Repository<FeedbackEntity>;
  private userRepository: Repository<UserEntity>;
  private profileRepository: Repository<ProfileEntity>;
  private commentRepository: Repository<CommentEntity>;
  private feedbackLikeRepository: FeedbackLikeRepository;

  constructor() {
    this.repository = AppDataSource.getRepository(FeedbackEntity);
    this.userRepository = AppDataSource.getRepository(UserEntity);
    this.profileRepository = AppDataSource.getRepository(ProfileEntity);
    this.commentRepository = AppDataSource.getRepository(CommentEntity);
    this.feedbackLikeRepository = new FeedbackLikeRepository();
  }

  async create(feedback: Feedback): Promise<Feedback> {
    const entity = this.toEntity(feedback);
    const saved = await this.repository.save(entity);

    // Fetch author info for the created feedback
    const author = await this.getAuthorInfo(saved.userId);
    return this.toDomain(saved, author, false, 0); // New feedback has 0 comments
  }

  async findById(id: string, currentUserId?: string): Promise<Feedback | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    const author = await this.getAuthorInfo(entity.userId);
    const isLiked = currentUserId ? await this.checkIfLiked(id, currentUserId) : false;
    const commentsCount = await this.getCommentsCount(id);
    return this.toDomain(entity, author, isLiked, commentsCount);
  }

  async findAll(limit?: number, offset?: number, currentUserId?: string): Promise<{ feedback: Feedback[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // Get liked feedback for current user
    const feedbackIds = entities.map(e => e.id);
    const likedFeedbackIds = currentUserId ?
      await this.feedbackLikeRepository.findLikedFeedbackByUser(currentUserId, feedbackIds) : [];

    // Get comments count for all feedback at once
    const commentsCountMap = await this.getCommentsCountForFeedback(feedbackIds);

    // Get author info for all feedback
    const feedback = await Promise.all(
      entities.map(async (entity) => {
        const author = await this.getAuthorInfo(entity.userId);
        const isLiked = likedFeedbackIds.includes(entity.id);
        const commentsCount = commentsCountMap.get(entity.id) || 0;
        return this.toDomain(entity, author, isLiked, commentsCount);
      })
    );

    return { feedback, total };
  }

  async update(feedback: Feedback): Promise<Feedback> {
    const entity = this.toEntity(feedback);
    const saved = await this.repository.save(entity);
    const commentsCount = await this.getCommentsCount(saved.id);
    return this.toDomain(saved, feedback.author, feedback.isLiked, commentsCount);
  }

  async delete(id: string): Promise<boolean> {
    try {
      // First delete all comments for this feedback
      await this.commentRepository.delete({ postId: id }); // Assuming comments use postId field for both posts and feedback

      // Then delete the feedback itself
      const result = await this.repository.delete(id);
      return result.affected !== 0;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return false;
    }
  }

  async incrementLikes(id: string): Promise<Feedback | null> {
    await this.repository.increment({ id }, 'likesCount', 1);
    return this.findById(id);
  }

  async decrementLikes(id: string): Promise<Feedback | null> {
    await this.repository.decrement({ id }, 'likesCount', 1);
    return this.findById(id);
  }

  // Comments count methods
  async getCommentsCount(feedbackId: string): Promise<number> {
    const count = await this.commentRepository.count({
      where: { postId: feedbackId } // Assuming comments use postId field for both posts and feedback
    });

    // Ensure it's a number
    return typeof count === 'string' ? parseInt(count, 10) : count;
  }

  async getCommentsCountForFeedback(feedbackIds: string[]): Promise<Map<string, number>> {
    if (feedbackIds.length === 0) return new Map();

    const counts = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.postId IN (:...feedbackIds)', { feedbackIds })
      .groupBy('comment.postId')
      .getRawMany();

    const countMap = new Map<string, number>();

    // Initialize all feedback with 0 comments
    feedbackIds.forEach(id => countMap.set(id, 0));

    // Set actual counts
    counts.forEach(({ postId, count }) => {
      countMap.set(postId, parseInt(count, 10));
    });

    return countMap;
  }

  private async checkIfLiked(feedbackId: string, userId: string): Promise<boolean> {
    const like = await this.feedbackLikeRepository.findByUserAndFeedback(userId, feedbackId);
    return !!like;
  }

  private async getAuthorInfo(userId: string): Promise<IAuthor> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const profile = await this.profileRepository.findOne({ where: { userId } });

      return {
        userId,
        name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
        email: user?.email || '',
        avatar: profile?.profilePhoto || '',
        level: profile?.level || 1,
      };
    } catch (error) {
      console.error('Error fetching author info:', error);
      return {
        userId,
        name: 'Unknown User',
        email: '',
        avatar: '',
        level: 1,
      };
    }
  }

  private toDomain(entity: FeedbackEntity, author: IAuthor, isLiked: boolean, commentsCount: number): Feedback {
    return new Feedback(
      entity.id,
      entity.content,
      entity.mediaUrls.split(',').filter(url => url),
      entity.likesCount,
      author,
      isLiked,
      commentsCount,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(feedback: Feedback): FeedbackEntity {
    const entity = new FeedbackEntity();
    entity.id = feedback.id;
    entity.userId = feedback.author.userId;
    entity.content = feedback.content;
    entity.mediaUrls = feedback.mediaUrls.join(',');
    entity.likesCount = feedback.likesCount;
    entity.createdAt = feedback.createdAt;
    entity.updatedAt = feedback.updatedAt;
    return entity;
  }
}