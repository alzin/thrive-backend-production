import { LessonRepository } from "../../../../infrastructure/database/repositories/LessonRepository";
import { KeywordRepository } from "../../../../infrastructure/database/repositories/KeywordRepository";
import { Keyword } from "../../../../domain/entities/Keyword";
import { LessonType } from "../../../../domain/entities/Lesson";

export class UpdateLessonUseCase {
    constructor(
        private readonly lessonRepository: LessonRepository,
        private readonly keywordRepository: KeywordRepository
    ) { }

    async execute(lessonId: string, updates: any) {
        const lesson = await this.lessonRepository.findById(lessonId);

        if (!lesson) {
            throw new Error('Lesson not found');
        }

        // If updating a KEYWORDS lesson, handle keywords update
        if (lesson.lessonType === LessonType.KEYWORDS && updates.keywords) {
            // Delete existing keywords
            await this.keywordRepository.deleteByLessonId(lessonId);

            // Create new keywords
            if (Array.isArray(updates.keywords) && updates.keywords.length > 0) {
                const keywordEntities = updates.keywords.map((kw: any, index: number) => new Keyword(
                    `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                    lessonId,
                    kw.englishText,
                    kw.japaneseText,
                    kw.englishSentence || '',
                    kw.japaneseSentence || '',
                    kw.englishAudioUrl,
                    kw.japaneseAudioUrl,
                    kw.japaneseSentenceAudioUrl,
                    index + 1,
                    new Date(),
                    new Date()
                ));

                await this.keywordRepository.createMany(keywordEntities);
            }

            // Remove keywords from updates to avoid trying to save them to lesson
            delete updates.keywords;
        }

        Object.assign(lesson, updates);
        lesson.updatedAt = new Date();

        return await this.lessonRepository.update(lesson);
    }
}