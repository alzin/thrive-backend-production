// backend/src/infrastructure/database/repositories/ProgressRepository.ts (Enhanced version)
import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ProgressEntity } from '../entities/Progress.entity';
import { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import { Progress } from '../../../domain/entities/Progress';

export class ProgressRepository implements IProgressRepository {
  private repository: Repository<ProgressEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProgressEntity);
  }

  async create(progress: Progress): Promise<Progress> {
    const entity = this.toEntity(progress);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Progress | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserAndLesson(userId: string, lessonId: string): Promise<Progress | null> {
    const entity = await this.repository.findOne({ where: { userId, lessonId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Progress[]> {
    const where = courseId ? { userId, courseId } : { userId }
    const entities = await this.repository.find({ where });
    return entities.map(e => this.toDomain(e));
  }

  // New method: Find progress for user in multiple courses (enrolled courses only)
  async findByUserAndCourses(userId: string, courseIds: string[]): Promise<Progress[]> {
    if (courseIds.length === 0) {
      return [];
    }

    const entities = await this.repository.find({
      where: {
        userId,
        courseId: In(courseIds)
      },
      order: {
        completedAt: 'DESC'
      }
    });
    return entities.map(e => this.toDomain(e));
  }

  // Enhanced method: Get completed lessons count with course filtering
  async getCompletedLessonCountForCourses(userId: string, courseIds: string[]): Promise<number> {
    if (courseIds.length === 0) {
      return 0;
    }

    return await this.repository.count({
      where: {
        userId,
        courseId: In(courseIds),
        isCompleted: true
      }
    });
  }

  async update(progress: Progress): Promise<Progress> {
    const entity = this.toEntity(progress);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async getCompletedLessonCount(userId: string, courseId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('progress')
      .select('COUNT(DISTINCT progress.lessonId)', 'count')
      .where({
        userId,
        courseId,
        isCompleted: true
      })
      .getRawOne();

    return result ? parseInt(result.count) : 0;
  }

  // New method: Get recent completed lessons from enrolled courses only
  async getRecentCompletedLessons(userId: string, courseIds: string[], limit: number = 10): Promise<Progress[]> {
    if (courseIds.length === 0) {
      return [];
    }

    const entities = await this.repository.find({
      where: {
        userId,
        courseId: In(courseIds),
        isCompleted: true
      },
      order: {
        completedAt: 'DESC'
      },
      take: limit
    });

    return entities.map(e => this.toDomain(e));
  }

  private toDomain(entity: ProgressEntity): Progress {
    return new Progress(
      entity.id,
      entity.userId,
      entity.lessonId,
      entity.courseId,
      entity.isCompleted,
      entity.completedAt ?? undefined,
      entity.reflectionSubmitted ?? undefined,
      entity.quizScore ?? undefined,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(progress: Progress): ProgressEntity {
    const entity = new ProgressEntity();
    entity.id = progress.id;
    entity.userId = progress.userId;
    entity.lessonId = progress.lessonId;
    entity.courseId = progress.courseId;
    entity.isCompleted = progress.isCompleted;
    entity.completedAt = progress.completedAt || null;
    entity.reflectionSubmitted = progress.reflectionSubmitted || null;
    entity.quizScore = progress.quizScore || null;
    entity.createdAt = progress.createdAt;
    entity.updatedAt = progress.updatedAt;
    return entity;
  }
}