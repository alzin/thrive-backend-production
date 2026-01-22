import { LessonRepository } from "../../../../infrastructure/database/repositories/LessonRepository";

export class DeleteLessonUseCase {
    constructor(
        private readonly lessonRepository: LessonRepository
    ) { }

    async execute(lessonId: string) {
        const deleted = await this.lessonRepository.delete(lessonId);

        if (!deleted) {
            throw new Error('Lesson not found');
        }

        return { message: 'Lesson deleted successfully' };
    }
}