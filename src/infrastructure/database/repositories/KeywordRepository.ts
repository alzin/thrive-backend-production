import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { KeywordEntity } from '../entities/Keyword.entity';
import { IKeywordRepository } from '../../../domain/repositories/IKeywordRepository';
import { Keyword } from '../../../domain/entities/Keyword';

export class KeywordRepository implements IKeywordRepository {
  private repository: Repository<KeywordEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(KeywordEntity);
  }

  async create(keyword: Keyword): Promise<Keyword> {
    const entity = this.toEntity(keyword);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async createMany(keywords: Keyword[]): Promise<Keyword[]> {
    const entities = keywords.map(k => this.toEntity(k));
    const saved = await this.repository.save(entities);
    return saved.map(e => this.toDomain(e));
  }

  async findById(id: string): Promise<Keyword | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByLessonId(lessonId: string): Promise<Keyword[]> {
    const entities = await this.repository.find({
      where: { lessonId },
      order: { order: 'ASC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async update(keyword: Keyword): Promise<Keyword> {
    const entity = this.toEntity(keyword);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async deleteByLessonId(lessonId: string): Promise<boolean> {
    const result = await this.repository.delete({ lessonId });
    return result.affected !== 0;
  }

  private toDomain(entity: KeywordEntity): Keyword {
    return new Keyword(
      entity.id,
      entity.lessonId,
      entity.englishText,
      entity.japaneseText,
      entity.englishSentence,
      entity.japaneseSentence,
      entity.englishAudioUrl ?? undefined,
      entity.japaneseAudioUrl ?? undefined,
      entity.japaneseSentenceAudioUrl ?? undefined,
      entity.order,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(keyword: Keyword): KeywordEntity {
    const entity = new KeywordEntity();
    entity.id = keyword.id;
    entity.lessonId = keyword.lessonId;
    entity.englishText = keyword.englishText;
    entity.japaneseText = keyword.japaneseText;
    entity.englishSentence = keyword.englishSentence;
    entity.japaneseSentence = keyword.japaneseSentence;
    entity.englishAudioUrl = keyword.englishAudioUrl || null;
    entity.japaneseAudioUrl = keyword.japaneseAudioUrl || null;
    entity.japaneseSentenceAudioUrl = keyword.japaneseSentenceAudioUrl || null;
    entity.order = keyword.order;
    entity.createdAt = keyword.createdAt;
    entity.updatedAt = keyword.updatedAt;
    return entity;
  }
}