import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { TrialAlternativeTimeRequestEntity } from '../entities/TrialAlternativeTimeRequest.entity';
import { ITrialAlternativeTimeRequestRepository } from '../../../domain/repositories/ITrialAlternativeTimeRequestRepository';
import { TrialAlternativeTimeRequest } from '../../../domain/entities/TrialAlternativeTimeRequest';

export class TrialAlternativeTimeRequestRepository implements ITrialAlternativeTimeRequestRepository {
  private repository: Repository<TrialAlternativeTimeRequestEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(TrialAlternativeTimeRequestEntity);
  }

  async create(request: TrialAlternativeTimeRequest): Promise<TrialAlternativeTimeRequest> {
    const requestEntity = this.toEntity(request);
    const savedEntity = await this.repository.save(requestEntity);
    return this.toDomain(savedEntity);
  }

  async findLatestByUserId(userId: string): Promise<TrialAlternativeTimeRequest | null> {
    const entity = await this.repository.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });

    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(entity: TrialAlternativeTimeRequestEntity): TrialAlternativeTimeRequest {
    return new TrialAlternativeTimeRequest(
      entity.id,
      entity.userId,
      entity.preferredTimes,
      entity.timeZone,
      entity.submittedAt,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(domain: TrialAlternativeTimeRequest): TrialAlternativeTimeRequestEntity {
    const entity = new TrialAlternativeTimeRequestEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.preferredTimes = domain.preferredTimes;
    entity.timeZone = domain.timeZone;
    entity.submittedAt = domain.submittedAt;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
