import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { PostLikeEntity } from '../entities/PostLike.entity';
import { PostLike } from '../../../domain/entities/PostLike';
import { IPostLikeRepository } from '../../../domain/repositories/IPostLikeRepository';

export class PostLikeRepository implements IPostLikeRepository {
  private repository: Repository<PostLikeEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(PostLikeEntity);
  }

  async create(postLike: PostLike): Promise<PostLike> {
    const entity = this.toEntity(postLike);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByUserAndPost(userId: string, postId: string): Promise<PostLike | null> {
    const entity = await this.repository.findOne({
      where: { userId, postId }
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPost(postId: string): Promise<PostLike[]> {
    const entities = await this.repository.find({
      where: { postId }
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByUser(userId: string): Promise<PostLike[]> {
    const entities = await this.repository.find({
      where: { userId }
    });
    return entities.map(e => this.toDomain(e));
  }

  async delete(userId: string, postId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId, postId });
    return result.affected !== 0;
  }

  async countByPost(postId: string): Promise<number> {
    return await this.repository.count({
      where: { postId }
    });
  }

  async findLikedPostsByUser(userId: string, postIds: string[]): Promise<string[]> {
    if (postIds.length === 0) return [];
    
    const entities = await this.repository.find({
      where: {
        userId,
        postId: In(postIds)
      },
      select: ['postId']
    });
    
    return entities.map(e => e.postId);
  }

  private toDomain(entity: PostLikeEntity): PostLike {
    return new PostLike(
      entity.id,
      entity.userId,
      entity.postId,
      entity.createdAt
    );
  }

  private toEntity(postLike: PostLike): PostLikeEntity {
    const entity = new PostLikeEntity();
    entity.id = postLike.id;
    entity.userId = postLike.userId;
    entity.postId = postLike.postId;
    entity.createdAt = postLike.createdAt;
    return entity;
  }
}