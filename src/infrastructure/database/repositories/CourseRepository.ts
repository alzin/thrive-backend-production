// backend/src/infrastructure/database/repositories/CourseRepository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { CourseEntity } from '../entities/Course.entity';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { Course } from '../../../domain/entities/Course';

export class CourseRepository implements ICourseRepository {
  private repository: Repository<CourseEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CourseEntity);
  }

  async create(course: Course): Promise<Course> {
    const entity = this.toEntity(course);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Course | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(isActive?: boolean): Promise<Course[]> {
    const where = isActive !== undefined ? { isActive } : {};
    const entities = await this.repository.find({
      where,
      order: { order: 'ASC' } // Changed from createdAt to order
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAllWithLessonCounts(isActive?: boolean, levelId?: string): Promise<(Course & { lessonCount: number })[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (levelId) where.levelId = levelId;

    const entities = await this.repository.find({
      where,
      order: { order: 'ASC' },
      relations: ['lessons', 'level']
    });

    return entities.map(e => ({
      ...this.toDomain(e),
      lessonCount: e.lessons?.length || 0,
      level: e.level ? { id: e.level.id, name: e.level.name } : null
    }));
  }

  async update(course: Course): Promise<Course> {
    const entity = this.toEntity(course);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  private toDomain(entity: CourseEntity): Course {
    return new Course(
      entity.id,
      entity.title,
      entity.description,
      entity.type,
      entity.icon,
      entity.isActive,
      entity.freeLessonCount,
      entity.order,
      entity.createdAt,
      entity.updatedAt,
      entity.levelId || null
    );
  }

  private toEntity(course: Course): CourseEntity {
    const entity = new CourseEntity();
    entity.id = course.id;
    entity.title = course.title;
    entity.description = course.description;
    entity.type = course.type;
    entity.icon = course.icon;
    entity.isActive = course.isActive;
    entity.freeLessonCount = course.freeLessonCount;
    entity.order = course.order;
    entity.levelId = course.levelId || null;
    entity.createdAt = course.createdAt;
    entity.updatedAt = course.updatedAt;
    return entity;
  }
}