import { Repository, IsNull } from 'typeorm';
import { Comment } from '../../../domain/entities/Comment';
import { ICommentRepository, PaginationOptions, PaginatedCommentsResult } from '../../../domain/repositories/ICommentRepository';
import { CommentEntity } from '../entities/Comment.entity';
import { AppDataSource } from '../config/database.config';

export class CommentRepository implements ICommentRepository {
  private repository: Repository<CommentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CommentEntity);
  }

  async create(comment: Comment): Promise<Comment> {
    const entity = this.toEntity(comment);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Comment | null> {
    const entity = await this.repository.findOne({
      where: { id }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByPostId(postId: string, options?: PaginationOptions): Promise<PaginatedCommentsResult> {
    const { page = 1, limit = 20, excludeReplies = false } = options || {};

    // Always exclude replies for main comment listing to prevent duplicates
    const queryBuilder = this.repository.createQueryBuilder('comment')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.parentCommentId IS NULL') // Only get top-level comments
      .orderBy('comment.createdAt', 'DESC');

    const [entities, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const comments = entities.map(entity => this.toDomain(entity));

    // Load replies for each top-level comment if not excluding replies
    if (!excludeReplies) {
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await this.findReplies(comment.id);
          comment.replies = replies;
          return comment;
        })
      );
      
      return {
        comments: commentsWithReplies,
        total
      };
    }

    return {
      comments,
      total
    };
  }

  async findReplies(parentCommentId: string): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { parentCommentId },
      order: { createdAt: 'ASC' }
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async update(comment: Comment): Promise<Comment> {
    const entity = this.toEntity(comment);
    
    // Use merge and save to ensure proper updates
    await this.repository.update(entity.id, {
      content: entity.content,
      updatedAt: entity.updatedAt
    });
    
    const updatedEntity = await this.repository.findOne({ where: { id: entity.id } });
    if (!updatedEntity) {
      throw new Error('Failed to update comment');
    }
    
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Use a transaction to ensure consistency
      const result = await AppDataSource.transaction(async manager => {
        // First delete all replies to this comment
        await manager.delete(CommentEntity, { parentCommentId: id });
        
        // Then delete the comment itself
        const deleteResult = await manager.delete(CommentEntity, { id });
        return deleteResult;
      });
      
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Count ALL comments for a post (including replies)
  async countByPost(postId: string): Promise<number> {
    return await this.repository.count({
      where: { postId }
    });
  }

  // Count only top-level comments (excluding replies) - FIXED
  async countTopLevelByPost(postId: string): Promise<number> {
    return await this.repository.count({
      where: { 
        postId,
        parentCommentId: IsNull() // Use IsNull() instead of null
      }
    });
  }

  // Get comment stats (total comments including replies, and top-level count)
  async getCommentStats(postId: string): Promise<{ total: number; topLevel: number; replies: number }> {
    const total = await this.countByPost(postId);
    const topLevel = await this.countTopLevelByPost(postId);
    const replies = total - topLevel;
    
    return { total, topLevel, replies };
  }

  // Helper method to get comment with all its nested replies
  async findByIdWithReplies(id: string): Promise<Comment | null> {
    const comment = await this.findById(id);
    if (!comment) return null;

    const replies = await this.findReplies(id);
    comment.replies = replies;

    return comment;
  }

  // Helper method to find all comments by user
  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Comment[]> {
    const queryBuilder = this.repository.createQueryBuilder('comment')
      .where('comment.userId = :userId', { userId })
      .orderBy('comment.createdAt', 'DESC');

    if (limit) {
      queryBuilder.take(limit);
    }

    if (offset) {
      queryBuilder.skip(offset);
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  // Get all top-level comments for a post - FIXED
  async findTopLevelCommentsByPost(postId: string): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { 
        postId,
        parentCommentId: IsNull() // Use IsNull() instead of null
      },
      order: { createdAt: 'DESC' }
    });

    return entities.map(entity => this.toDomain(entity));
  }

  // Method to soft delete (if you want to implement soft deletes in the future)
  async softDelete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.update(id, { 
        // Add a deletedAt field to your entity if you want soft deletes
        // deletedAt: new Date()
      });
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error('Error soft deleting comment:', error);
      return false;
    }
  }

  private toEntity(comment: Comment): CommentEntity {
    const entity = new CommentEntity();
    entity.id = comment.id;
    entity.postId = comment.postId;
    entity.userId = comment.userId;
    entity.content = comment.content;
    entity.parentCommentId = comment.parentCommentId;
    entity.createdAt = comment.createdAt;
    entity.updatedAt = comment.updatedAt;
    return entity;
  }

  private toDomain(entity: CommentEntity): Comment {
    // Create a basic author object - this will be enriched by the use case or controller
    const author = {
      userId: entity.userId,
      name: '',
      email: '',
      avatar: '',
      level: 1
    };

    return new Comment(
      entity.id,
      entity.postId,
      entity.userId,
      entity.content,
      entity.parentCommentId,
      author,
      entity.createdAt,
      entity.updatedAt
    );
  }
}