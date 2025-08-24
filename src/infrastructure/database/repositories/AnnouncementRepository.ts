import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { AnnouncementEntity } from '../entities/Announcement.entity';
import { UserEntity } from '../entities/User.entity';
import { ProfileEntity } from '../entities/Profile.entity';
import { CommentEntity } from '../entities/Comment.entity';
import { IAnnouncementRepository } from '../../../domain/repositories/IAnnouncementRepository';
import { Announcement, IAuthor } from '../../../domain/entities/Announcement';
import { AnnouncementLikeRepository } from './AnnouncementLikeRepository';

export class AnnouncementRepository implements IAnnouncementRepository {
  private repository: Repository<AnnouncementEntity>;
  private userRepository: Repository<UserEntity>;
  private profileRepository: Repository<ProfileEntity>;
  private commentRepository: Repository<CommentEntity>;
  private announcementLikeRepository: AnnouncementLikeRepository;

  constructor() {
    this.repository = AppDataSource.getRepository(AnnouncementEntity);
    this.userRepository = AppDataSource.getRepository(UserEntity);
    this.profileRepository = AppDataSource.getRepository(ProfileEntity);
    this.commentRepository = AppDataSource.getRepository(CommentEntity);
    this.announcementLikeRepository = new AnnouncementLikeRepository();
  }

  async create(announcement: Announcement): Promise<Announcement> {
    const entity = this.toEntity(announcement);
    const saved = await this.repository.save(entity);
    
    // Fetch author info for the created announcement
    const author = await this.getAuthorInfo(saved.userId);
    return this.toDomain(saved, author, false, 0); // New announcements have 0 comments
  }

  async findById(id: string, currentUserId?: string): Promise<Announcement | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    
    const author = await this.getAuthorInfo(entity.userId);
    const isLiked = currentUserId ? await this.checkIfLiked(id, currentUserId) : false;
    const commentsCount = await this.getCommentsCount(id);
    return this.toDomain(entity, author, isLiked, commentsCount);
  }

  async findAll(limit?: number, offset?: number, currentUserId?: string): Promise<{ announcements: Announcement[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    
    // Get liked announcements for current user
    const announcementIds = entities.map(e => e.id);
    const likedAnnouncementIds = currentUserId ? 
      await this.announcementLikeRepository.findLikedAnnouncementsByUser(currentUserId, announcementIds) : [];
    
    // Get comments count for all announcements at once
    const commentsCountMap = await this.getCommentsCountForAnnouncements(announcementIds);
    
    // Get author info for all announcements
    const announcements = await Promise.all(
      entities.map(async (entity) => {
        const author = await this.getAuthorInfo(entity.userId);
        const isLiked = likedAnnouncementIds.includes(entity.id);
        const commentsCount = commentsCountMap.get(entity.id) || 0;
        return this.toDomain(entity, author, isLiked, commentsCount);
      })
    );
    
    return { announcements, total };
  }

  async findByUserId(userId: string, currentUserId?: string): Promise<Announcement[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    
    const announcementIds = entities.map(e => e.id);
    const likedAnnouncementIds = currentUserId ? 
      await this.announcementLikeRepository.findLikedAnnouncementsByUser(currentUserId, announcementIds) : [];
    
    // Get comments count for all announcements
    const commentsCountMap = await this.getCommentsCountForAnnouncements(announcementIds);
    
    const author = await this.getAuthorInfo(userId);
    return entities.map(e => this.toDomain(
      e, 
      author, 
      likedAnnouncementIds.includes(e.id),
      commentsCountMap.get(e.id) || 0
    ));
  }

  async update(announcement: Announcement): Promise<Announcement> {
    const entity = this.toEntity(announcement);
    const saved = await this.repository.save(entity);
    const commentsCount = await this.getCommentsCount(saved.id);
    return this.toDomain(saved, announcement.author, announcement.isLiked, commentsCount);
  }

  async delete(id: string): Promise<boolean> {
    try {
      // First delete all comments for this announcement
      await this.commentRepository.delete({ postId: id }); // Using postId field for announcements too
      
      // Then delete the announcement itself
      const result = await this.repository.delete(id);
      return result.affected !== 0;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }
  }

  async incrementLikes(id: string): Promise<Announcement | null> {
    await this.repository.increment({ id }, 'likesCount', 1);
    return this.findById(id);
  }

  async decrementLikes(id: string): Promise<Announcement | null> {
    await this.repository.decrement({ id }, 'likesCount', 1);
    return this.findById(id);
  }

  // Comments count methods
  async getCommentsCount(announcementId: string): Promise<number> {
    return await this.commentRepository.count({
      where: { postId: announcementId } // Using postId field for announcements too
    });
  }

  async getCommentsCountForAnnouncements(announcementIds: string[]): Promise<Map<string, number>> {
    if (announcementIds.length === 0) return new Map();

    const counts = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.postId IN (:...announcementIds)', { announcementIds })
      .groupBy('comment.postId')
      .getRawMany();

    const countMap = new Map<string, number>();
    
    // Initialize all announcements with 0 comments
    announcementIds.forEach(id => countMap.set(id, 0));
    
    // Set actual counts
    counts.forEach(({ postId, count }) => {
      countMap.set(postId, parseInt(count, 10));
    });

    return countMap;
  }

  private async checkIfLiked(announcementId: string, userId: string): Promise<boolean> {
    const like = await this.announcementLikeRepository.findByUserAndAnnouncement(userId, announcementId);
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

  private toDomain(entity: AnnouncementEntity, author: IAuthor, isLiked: boolean, commentsCount: number): Announcement {
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

  private toEntity(announcement: Announcement): AnnouncementEntity {
    const entity = new AnnouncementEntity();
    entity.id = announcement.id;
    entity.userId = announcement.author.userId;
    entity.content = announcement.content;
    entity.likesCount = announcement.likesCount;
    entity.createdAt = announcement.createdAt;
    entity.updatedAt = announcement.updatedAt;
    return entity;
  }
}