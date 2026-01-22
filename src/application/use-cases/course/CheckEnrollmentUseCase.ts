import { EnrollmentRepository } from "../../../infrastructure/database/repositories/EnrollmentRepository";

// backend/src/application/use-cases/course/CheckEnrollmentUseCase.ts
export interface CheckEnrollmentRequest {
    userId: string;
    courseId: string;
}

export interface CheckEnrollmentResponse {
    isEnrolled: boolean;
}

export class CheckEnrollmentUseCase {
    constructor(private enrollmentRepository: EnrollmentRepository) { }

    async execute(request: CheckEnrollmentRequest): Promise<CheckEnrollmentResponse> {
        const { userId, courseId } = request;

        const enrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);

        return { isEnrolled: !!enrollment };
    }
}
