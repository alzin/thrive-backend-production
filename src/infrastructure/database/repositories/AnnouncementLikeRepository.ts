import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { AnnouncementLikeEntity } from '../entities/AnnouncementLike.entity';
import { AnnouncementLike } from '../../../domain/entities/AnnouncementLike';

export class AnnouncementLikeRepository {
  private repository: Repository<AnnouncementLikeEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(AnnouncementLikeEntity);
  }

  async create(announcementLike: AnnouncementLike): Promise<AnnouncementLike> {
    const entity = this.toEntity(announcementLike);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByUserAndAnnouncement(userId: string, announcementId: string): Promise<AnnouncementLike | null> {
    const entity = await this.repository.findOne({
      where: { userId, announcementId }
    });
    return entity ? this.toDomain(entity) : null;
  }

  async delete(userId: string, announcementId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId, announcementId });
    return result.affected !== 0;
  }

  async findLikedAnnouncementsByUser(userId: string, announcementIds: string[]): Promise<string[]> {
    if (announcementIds.length === 0) return [];

    const entities = await this.repository.find({
      where: {
        userId,
        announcementId: announcementIds.length > 0 ? 
          announcementIds.reduce((acc, id, index) => {
            acc[index === 0 ? 'announcementId' : `announcementId_${index}`] = id;
            return acc;
          }, {} as any) : undefined
      },
      select: ['announcementId']
    });

    return entities.map(entity => entity.announcementId);
  }

  private toDomain(entity: AnnouncementLikeEntity): AnnouncementLike {
    return new AnnouncementLike(
      entity.id,
      entity.userId,
      entity.announcementId,
      entity.createdAt
    );
  }

  private toEntity(announcementLike: AnnouncementLike): AnnouncementLikeEntity {
    const entity = new AnnouncementLikeEntity();
    entity.id = announcementLike.id;
    entity.userId = announcementLike.userId;
    entity.announcementId = announcementLike.announcementId;
    entity.createdAt = announcementLike.createdAt;
    return entity;
  }
}