// backend/src/infrastructure/database/repositories/PostRepository.ts (Updated)
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { PostEntity } from '../entities/Post.entity';
import { UserEntity } from '../entities/User.entity';
import { ProfileEntity } from '../entities/Profile.entity';
import { CommentEntity } from '../entities/Comment.entity';
import { IPostRepository } from '../../../domain/repositories/IPostRepository';
import { Post, IAuthor } from '../../../domain/entities/Post';
import { PostLikeRepository } from './PostLikeRepository';
import { AnnouncementEntity } from '../entities/Announcement.entity';
import { Announcement } from '../../../domain/entities/Announcement';

export class PostRepository implements IPostRepository {
  private repository: Repository<PostEntity>;
  private announcementRepository: Repository<AnnouncementEntity>;
  private userRepository: Repository<UserEntity>;
  private profileRepository: Repository<ProfileEntity>;
  private commentRepository: Repository<CommentEntity>;
  private postLikeRepository: PostLikeRepository;

  constructor() {
    this.repository = AppDataSource.getRepository(PostEntity);
    this.announcementRepository = AppDataSource.getRepository(AnnouncementEntity);
    this.userRepository = AppDataSource.getRepository(UserEntity);
    this.profileRepository = AppDataSource.getRepository(ProfileEntity);
    this.commentRepository = AppDataSource.getRepository(CommentEntity);
    this.postLikeRepository = new PostLikeRepository();
  }

  async create(post: Post): Promise<Post> {
    const entity = this.toEntity(post);
    const saved = await this.repository.save(entity);

    // Fetch author info for the created post
    const author = await this.getAuthorInfo(saved.userId);
    return this.toDomain(saved, author, false, 0); // New posts have 0 comments
  }

  async findById(id: string, currentUserId?: string): Promise<Post | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    const author = await this.getAuthorInfo(entity.userId);
    const isLiked = currentUserId ? await this.checkIfLiked(id, currentUserId) : false;
    const commentsCount = await this.getCommentsCount(id);
    return this.toDomain(entity, author, isLiked, commentsCount);
  }

  async findPostAndAnnouncementById(id: string, currentUserId?: string): Promise<Post | Announcement | null> {
    const postEntity = await this.repository.findOne({ where: { id } });
    const announcementEntity = await this.announcementRepository.findOne({ where: { id } });
    let entity = postEntity || announcementEntity || null;

    if (!entity) return null;

    const author = await this.getAuthorInfo(entity.userId);
    const isLiked = currentUserId ? await this.checkIfLiked(id, currentUserId) : false;
    const commentsCount = await this.getCommentsCount(id);
    return postEntity ?
      this.toDomain(postEntity, author, isLiked, commentsCount) :
      this.toAnnouncementDomain(entity, author, isLiked, commentsCount);
  }

  async findAll(limit?: number, offset?: number, currentUserId?: string): Promise<{ posts: Post[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // Get liked posts for current user
    const postIds = entities.map(e => e.id);
    const likedPostIds = currentUserId ?
      await this.postLikeRepository.findLikedPostsByUser(currentUserId, postIds) : [];

    // Get comments count for all posts at once
    const commentsCountMap = await this.getCommentsCountForPosts(postIds);

    // Get author info for all posts
    const posts = await Promise.all(
      entities.map(async (entity) => {
        const author = await this.getAuthorInfo(entity.userId);
        const isLiked = likedPostIds.includes(entity.id);
        const commentsCount = commentsCountMap.get(entity.id) || 0;
        return this.toDomain(entity, author, isLiked, commentsCount);
      })
    );

    return { posts, total };
  }

  async findByUserId(userId: string, currentUserId?: string): Promise<Post[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const postIds = entities.map(e => e.id);
    const likedPostIds = currentUserId ?
      await this.postLikeRepository.findLikedPostsByUser(currentUserId, postIds) : [];

    // Get comments count for all posts
    const commentsCountMap = await this.getCommentsCountForPosts(postIds);

    const author = await this.getAuthorInfo(userId);
    return entities.map(e => this.toDomain(
      e,
      author,
      likedPostIds.includes(e.id),
      commentsCountMap.get(e.id) || 0
    ));
  }

  async update(post: Post): Promise<Post> {
    const entity = this.toEntity(post);
    const saved = await this.repository.save(entity);
    const commentsCount = await this.getCommentsCount(saved.id);
    return this.toDomain(saved, post.author, post.isLiked, commentsCount);
  }

  async delete(id: string): Promise<boolean> {
    try {
      // First delete all comments for this post
      await this.commentRepository.delete({ postId: id });

      // Then delete the post itself
      const result = await this.repository.delete(id);
      return result.affected !== 0;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  async incrementLikes(id: string): Promise<Post | null> {
    await this.repository.increment({ id }, 'likesCount', 1);
    return this.findById(id);
  }

  async decrementLikes(id: string): Promise<Post | null> {
    await this.repository.decrement({ id }, 'likesCount', 1);
    return this.findById(id);
  }

  // Comments count methods
  async getCommentsCount(postId: string): Promise<number> {
    const count = await this.commentRepository.count({
      where: { postId }
    });

    // Ensure it's a number
    return typeof count === 'string' ? parseInt(count, 10) : count;
  }

  async getCommentsCountForPosts(postIds: string[]): Promise<Map<string, number>> {
    if (postIds.length === 0) return new Map();

    const counts = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.postId IN (:...postIds)', { postIds })
      .groupBy('comment.postId')
      .getRawMany();

    const countMap = new Map<string, number>();

    // Initialize all posts with 0 comments
    postIds.forEach(id => countMap.set(id, 0));

    // Set actual counts
    counts.forEach(({ postId, count }) => {
      countMap.set(postId, parseInt(count, 10));
    });

    return countMap;
  }

  // Method to increment comment count when a comment is added
  async incrementCommentsCount(postId: string): Promise<void> {
    // We don't need to store comment count in post entity since we calculate it dynamically
    // This method can be used for optimization if needed in the future
  }

  // Method to decrement comment count when a comment is deleted
  async decrementCommentsCount(postId: string): Promise<void> {
    // We don't need to store comment count in post entity since we calculate it dynamically
    // This method can be used for optimization if needed in the future
  }

  private async checkIfLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.postLikeRepository.findByUserAndPost(userId, postId);
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

  // FIXED: Parameter order and ensure commentsCount is a number
  private toDomain(entity: PostEntity, author: IAuthor, isLiked: boolean, commentsCount: number): Post {
    return new Post(
      entity.id,
      author,
      entity.content,
      entity.mediaUrls.split(',').filter(url => url),
      entity.likesCount,
      isLiked,
      entity.createdAt,
      entity.updatedAt,
      commentsCount  // This should be last parameter and should be a number
    );
  }

  private toAnnouncementDomain(entity: AnnouncementEntity, author: IAuthor, isLiked: boolean, commentsCount: number): Announcement {
    return new Announcement(
      entity.id,
      author,
      entity.content,
      entity.likesCount,
      isLiked,
      entity.createdAt,
      entity.updatedAt,
      commentsCount
    );
  }

  private toEntity(post: Post): PostEntity {
    const entity = new PostEntity();
    entity.id = post.id;
    entity.userId = post.author.userId;
    entity.content = post.content;
    entity.mediaUrls = post.mediaUrls.join(',');
    entity.likesCount = post.likesCount;
    entity.createdAt = post.createdAt;
    entity.updatedAt = post.updatedAt;
    return entity;
  }
}