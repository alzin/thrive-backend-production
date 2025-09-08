// backend/src/infrastructure/database/repositories/FeedbackLikeRepository.ts
import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { FeedbackLike } from '../../../domain/entities/FeedbackLike';
import { IFeedbackLikeRepository } from '../../../domain/repositories/IFeedbackLikeRepository';
import { FeedbackLikesEntity } from '../entities/FeedbackLike.entity';

export class FeedbackLikeRepository implements IFeedbackLikeRepository {
  private repository: Repository<FeedbackLikesEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(FeedbackLikesEntity);
  }

  async create(feedbackLike: FeedbackLike): Promise<FeedbackLike> {
    const entity = this.toEntity(feedbackLike);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByUserAndFeedback(userId: string, feedbackId: string): Promise<FeedbackLike | null> {
    const entity = await this.repository.findOne({
      where: { userId, feedbackId }
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFeedback(feedbackId: string): Promise<FeedbackLike[]> {
    const entities = await this.repository.find({
      where: { feedbackId }
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByUser(userId: string): Promise<FeedbackLike[]> {
    const entities = await this.repository.find({
      where: { userId }
    });
    return entities.map(e => this.toDomain(e));
  }

  async delete(userId: string, feedbackId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId, feedbackId });
    return result.affected !== 0;
  }

  async countByFeedback(feedbackId: string): Promise<number> {
    return await this.repository.count({
      where: { feedbackId }
    });
  }

  async findLikedFeedbackByUser(userId: string, feedbackIds: string[]): Promise<string[]> {
    if (feedbackIds.length === 0) return [];

    const entities = await this.repository.find({
      where: {
        userId,
        feedbackId: In(feedbackIds)
      },
      select: ['feedbackId']
    });

    return entities.map(entity => entity.feedbackId);
  }

  private toDomain(entity: FeedbackLikesEntity): FeedbackLike {
    return new FeedbackLike(
      entity.id,
      entity.userId,
      entity.feedbackId,
      entity.createdAt
    );
  }

  private toEntity(feedbackLike: FeedbackLike): FeedbackLikesEntity {
    const entity = new FeedbackLikesEntity();
    entity.id = feedbackLike.id;
    entity.userId = feedbackLike.userId;
    entity.feedbackId = feedbackLike.feedbackId;
    entity.createdAt = feedbackLike.createdAt;
    return entity;
  }
}