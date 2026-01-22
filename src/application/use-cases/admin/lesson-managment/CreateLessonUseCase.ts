import { LessonRepository } from "../../../../infrastructure/database/repositories/LessonRepository";
import { KeywordRepository } from "../../../../infrastructure/database/repositories/KeywordRepository";
import { Lesson, LessonType } from "../../../../domain/entities/Lesson";
import { Keyword } from "../../../../domain/entities/Keyword";

interface CreateLessonInput {
    courseId: string;
    title: string;
    description: string;
    order: number;
    lessonType?: LessonType;
    contentUrl?: string;
    contentData?: any;
    audioFiles?: string[];
    resources?: any[];
    requiresReflection?: boolean;
    pointsReward?: number;
    passingScore?: number;
    keywords?: any[];
}

export class CreateLessonUseCase {
    constructor(
        private readonly lessonRepository: LessonRepository,
        private readonly keywordRepository: KeywordRepository
    ) { }

    async execute(input: CreateLessonInput) {
        const lesson = new Lesson(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            input.courseId,
            input.title,
            input.description,
            input.order,
            input.lessonType || LessonType.VIDEO,
            input.contentUrl,
            input.contentData,
            input.audioFiles || [],
            input.resources || [],
            input.requiresReflection || false,
            input.pointsReward || 0,
            input.passingScore,
            new Date(),
            new Date()
        );

        const savedLesson = await this.lessonRepository.create(lesson);

        // If lesson type is KEYWORDS and keywords are provided, save them
        if (input.lessonType === LessonType.KEYWORDS && input.keywords && Array.isArray(input.keywords)) {
            const keywordEntities = input.keywords.map((kw: any, index: number) => new Keyword(
                `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                savedLesson.id,
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

        return savedLesson;
    }
}