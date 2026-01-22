import { CourseRepository } from "../../../../infrastructure/database/repositories/CourseRepository";

export class UpdateCourseUseCase {
    constructor(
        private readonly courseRepository: CourseRepository
    ) { }

    async execute(courseId: string, updates: any) {
        const course = await this.courseRepository.findById(courseId);

        if (!course) {
            throw new Error('Course not found');
        }

        Object.assign(course, updates);
        course.updatedAt = new Date();

        return await this.courseRepository.update(course);
    }
}