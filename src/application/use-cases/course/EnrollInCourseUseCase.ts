// backend/src/application/use-cases/course/EnrollInCourseUseCase.ts
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { Enrollment } from '../../../domain/entities/Enrollment';

export interface EnrollInCourseDTO {
  userId: string;
  courseId: string;
}

export class EnrollInCourseUseCase {
  constructor(
    private courseRepository: ICourseRepository,
    private enrollmentRepository: IEnrollmentRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: EnrollInCourseDTO): Promise<Enrollment> {
    // Check if course exists
    const course = await this.courseRepository.findById(dto.courseId);
    if (!course || !course.isActive) {
      throw new Error('Course not found or inactive');
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentRepository.findByUserAndCourse(
      dto.userId,
      dto.courseId
    );
    if (existingEnrollment) {
      throw new Error('Already enrolled in this course');
    }

    // Create enrollment
    const enrollment = new Enrollment(
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      dto.userId,
      dto.courseId,
      new Date(),
      new Date(),
      new Date()
    );

    return await this.enrollmentRepository.create(enrollment);
  }
}