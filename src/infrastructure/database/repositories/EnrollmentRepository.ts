// backend/src/infrastructure/database/repositories/EnrollmentRepository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { EnrollmentEntity } from '../entities/Enrollment.entity';
import { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import { Enrollment } from '../../../domain/entities/Enrollment';

export class EnrollmentRepository implements IEnrollmentRepository {
  private repository: Repository<EnrollmentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(EnrollmentEntity);
  }

  async create(enrollment: Enrollment): Promise<Enrollment> {
    const entity = this.toEntity(enrollment);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    const entity = await this.repository.findOne({ where: { userId, courseId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Enrollment[]> {
    const entities = await this.repository.find({ where: { userId }, order: { createdAt: 'DESC' }, });
    return entities.map(e => this.toDomain(e));
  }

  async findByCourseId(courseId: string): Promise<Enrollment[]> {
    const entities = await this.repository.find({ where: { courseId } });
    return entities.map(e => this.toDomain(e));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  private toDomain(entity: EnrollmentEntity): Enrollment {
    return new Enrollment(
      entity.id,
      entity.userId,
      entity.courseId,
      entity.enrolledAt,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(enrollment: Enrollment): EnrollmentEntity {
    const entity = new EnrollmentEntity();
    entity.id = enrollment.id;
    entity.userId = enrollment.userId;
    entity.courseId = enrollment.courseId;
    entity.enrolledAt = enrollment.enrolledAt;
    entity.createdAt = enrollment.createdAt;
    entity.updatedAt = enrollment.updatedAt;
    return entity;
  }
}