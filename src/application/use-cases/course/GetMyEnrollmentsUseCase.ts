// backend/src/application/use-cases/course/GetMyEnrollmentsUseCase.ts
import { CourseRepository } from '../../../infrastructure/database/repositories/CourseRepository';
import { EnrollmentRepository } from '../../../infrastructure/database/repositories/EnrollmentRepository';

export interface GetMyEnrollmentsRequest {
    userId: string;
}

export class GetMyEnrollmentsUseCase {
    constructor(
        private enrollmentRepository: EnrollmentRepository,
        private courseRepository: CourseRepository
    ) { }

    async execute(request: GetMyEnrollmentsRequest): Promise<any[]> {
        const { userId } = request;

        const enrollments = await this.enrollmentRepository.findByUserId(userId);

        const enrollmentsWithCourses = await Promise.all(
            enrollments.map(async (enrollment) => {
                const course = await this.courseRepository.findById(enrollment.courseId);
                return { ...enrollment, course };
            })
        );

        return enrollmentsWithCourses;
    }
}