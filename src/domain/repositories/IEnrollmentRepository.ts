// backend/src/domain/repositories/IEnrollmentRepository.ts
import { Enrollment } from '../entities/Enrollment';

export interface IEnrollmentRepository {
  create(enrollment: Enrollment): Promise<Enrollment>;
  findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null>;
  findByUserId(userId: string): Promise<Enrollment[]>;
  findByCourseId(courseId: string): Promise<Enrollment[]>;
  delete(id: string): Promise<boolean>;
}