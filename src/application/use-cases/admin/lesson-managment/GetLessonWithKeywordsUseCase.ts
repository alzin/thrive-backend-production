import { LessonRepository } from "../../../../infrastructure/database/repositories/LessonRepository";
import { KeywordRepository } from "../../../../infrastructure/database/repositories/KeywordRepository";
import { LessonType } from "../../../../domain/entities/Lesson";

export class GetLessonWithKeywordsUseCase {
    constructor(
        private readonly lessonRepository: LessonRepository,
        private readonly keywordRepository: KeywordRepository
    ) { }

    async execute(lessonId: string) {
        const lesson = await this.lessonRepository.findById(lessonId);

        if (!lesson) {
            throw new Error('Lesson not found');
        }

        let keywords: any[] = [];
        if (lesson.lessonType === LessonType.KEYWORDS) {
            keywords = await this.keywordRepository.findByLessonId(lessonId);
        }

        return { ...lesson, keywords };
    }
}