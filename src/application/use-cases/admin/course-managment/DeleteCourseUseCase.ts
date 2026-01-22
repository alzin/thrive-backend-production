import { CourseRepository } from "../../../../infrastructure/database/repositories/CourseRepository";

export class DeleteCourseUseCase {
    constructor(
        private readonly courseRepository: CourseRepository
    ) { }

    async execute(courseId: string) {
        const deleted = await this.courseRepository.delete(courseId);

        if (!deleted) {
            throw new Error('Course not found');
        }

        return { message: 'Course deleted successfully' };
    }
}