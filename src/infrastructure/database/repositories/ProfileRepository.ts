import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ProfileEntity } from '../entities/Profile.entity';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { Profile } from '../../../domain/entities/Profile';

export class ProfileRepository implements IProfileRepository {
  private repository: Repository<ProfileEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProfileEntity);
  }

  async create(profile: Profile): Promise<Profile> {
    const profileEntity = this.toEntity(profile);
    const savedEntity = await this.repository.save(profileEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Profile | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const entity = await this.repository.findOne({ where: { userId } });
    return entity ? this.toDomain(entity) : null;
  }

  async update(profile: Profile): Promise<Profile> {
    const profileEntity = this.toEntity(profile);
    const savedEntity = await this.repository.save(profileEntity);
    return this.toDomain(savedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async findAll(): Promise<Profile[]> {
    const entities = await this.repository.find();
    return entities.map(entity => this.toDomain(entity));
  }

  async updatePoints(userId: string, points: number): Promise<Profile | null> {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;

    if (points > 0) {
      profile.addPoints(points);
    } else {
      profile.removePoints(Math.abs(points));
    }

    return await this.update(profile);
  }

  private toDomain(entity: ProfileEntity): Profile {
    return new Profile(
      entity.id,
      entity.userId,
      entity.name,
      entity.bio,
      entity.profilePhoto,
      entity.languageLevel,
      entity.points,
      entity.badges,
      entity.level,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(domain: Profile): ProfileEntity {
    const entity = new ProfileEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.name = domain.name;
    entity.bio = domain.bio || '';
    entity.profilePhoto = domain.profilePhoto || '';
    entity.languageLevel = domain.languageLevel || '';
    entity.points = domain.points;
    entity.badges = domain.badges;
    entity.level = domain.level;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}