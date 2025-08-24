import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { LessonEntity } from '../entities/Lesson.entity';
import { ILessonRepository } from '../../../domain/repositories/ILessonRepository';
import { Lesson } from '../../../domain/entities/Lesson';

export class LessonRepository implements ILessonRepository {
  private repository: Repository<LessonEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(LessonEntity);
  }

  async create(lesson: Lesson): Promise<Lesson> {
    const entity = this.toEntity(lesson);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Lesson | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    const entities = await this.repository.find({
      where: { courseId },
      order: { order: 'ASC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByCourseIdAndOrder(courseId: string, order: number): Promise<Lesson | null> {
    const entity = await this.repository.findOne({ where: { courseId, order } });
    return entity ? this.toDomain(entity) : null;
  }

  async update(lesson: Lesson): Promise<Lesson> {
    const entity = this.toEntity(lesson);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  private toDomain(entity: LessonEntity): Lesson {
    return new Lesson(
      entity.id,
      entity.courseId,
      entity.title,
      entity.description,
      entity.order,
      entity.lessonType,
      entity.contentUrl ?? undefined,
      entity.contentData ?? undefined,
      entity.audioFiles.split(',').filter(f => f),
      entity.resources.split(',').filter(r => r),
      entity.requiresReflection,
      entity.pointsReward,
      entity.passingScore ?? undefined,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(lesson: Lesson): LessonEntity {
    const entity = new LessonEntity();
    entity.id = lesson.id;
    entity.courseId = lesson.courseId;
    entity.title = lesson.title;
    entity.description = lesson.description;
    entity.order = lesson.order;
    entity.lessonType = lesson.lessonType;
    entity.contentUrl = lesson.contentUrl || null;
    entity.contentData = lesson.contentData || null;
    
    // Handle audioFiles - ensure it's an array before joining
    entity.audioFiles = Array.isArray(lesson.audioFiles) 
      ? lesson.audioFiles.join(',') 
      : '';
      
    // Handle resources - ensure it's an array before joining  
    entity.resources = Array.isArray(lesson.resources) 
      ? lesson.resources.join(',') 
      : '';
      
    entity.requiresReflection = lesson.requiresReflection;
    entity.pointsReward = lesson.pointsReward;
    entity.passingScore = lesson.passingScore || null;
    return entity;
  }
}