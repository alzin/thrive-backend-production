import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { LevelEntity } from '../entities/Level.entity';
import { ILevelRepository } from '../../../domain/repositories/ILevelRepository';
import { Level } from '../../../domain/entities/Level';

export class LevelRepository implements ILevelRepository {
  private repository: Repository<LevelEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(LevelEntity);
  }

  async create(level: Level): Promise<Level> {
    const entity = this.toEntity(level);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Level | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Level[]> {
    const entities = await this.repository.find({ order: { createdAt: 'ASC' } });
    return entities.map(e => this.toDomain(e));
  }

  async update(level: Level): Promise<Level> {
    const entity = this.toEntity(level);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  private toDomain(entity: LevelEntity): Level {
    return new Level(
      entity.id,
      entity.name,
      entity.description,
      entity.createdAt
    );
  }

  private toEntity(level: Level): LevelEntity {
    const entity = new LevelEntity();
    entity.id = level.id;
    entity.name = level.name;
    entity.description = level.description;
    entity.createdAt = level.createdAt;
    return entity;
  }
}
