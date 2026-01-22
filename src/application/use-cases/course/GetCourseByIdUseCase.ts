import { CourseRepository } from "../../../infrastructure/database/repositories/CourseRepository";

// backend/src/application/use-cases/course/GetCourseByIdUseCase.ts
export interface GetCourseByIdRequest {
    courseId: string;
}

export class GetCourseByIdUseCase {
    constructor(private courseRepository: CourseRepository) { }

    async execute(request: GetCourseByIdRequest): Promise<any> {
        const { courseId } = request;

        const course = await this.courseRepository.findById(courseId);

        if (!course) {
            throw new Error('Course not found');
        }

        return course;
    }
}