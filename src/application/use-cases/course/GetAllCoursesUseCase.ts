// backend/src/application/use-cases/course/GetAllCoursesUseCase.ts
import { CourseRepository } from '../../../infrastructure/database/repositories/CourseRepository';

export interface GetAllCoursesRequest {
    userRole?: string;
}

export class GetAllCoursesUseCase {
    constructor(private courseRepository: CourseRepository) { }

    async execute(request: GetAllCoursesRequest): Promise<any[]> {
        const { userRole } = request;
        const getOnlyActive = userRole !== "ADMIN" ? true : undefined;

        return await this.courseRepository.findAllWithLessonCounts(getOnlyActive);
    }
}