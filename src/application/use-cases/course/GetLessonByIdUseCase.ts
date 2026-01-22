import { KeywordRepository } from "../../../infrastructure/database/repositories/KeywordRepository";
import { LessonRepository } from "../../../infrastructure/database/repositories/LessonRepository";
import { ProgressRepository } from "../../../infrastructure/database/repositories/ProgressRepository";

// backend/src/application/use-cases/course/GetLessonByIdUseCase.ts
export interface GetLessonByIdRequest {
    lessonId: string;
    userId: string;
}

export class GetLessonByIdUseCase {
    constructor(
        private lessonRepository: LessonRepository,
        private keywordRepository: KeywordRepository,
        private progressRepository: ProgressRepository
    ) { }

    async execute(request: GetLessonByIdRequest): Promise<any> {
        const { lessonId, userId } = request;

        const lesson = await this.lessonRepository.findById(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        const progress = await this.progressRepository.findByUserAndLesson(userId, lessonId);

        const lessonResponse: any = {
            id: lesson.id,
            courseId: lesson.courseId,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            lessonType: lesson.lessonType,
            contentUrl: lesson.contentUrl,
            contentData: lesson.contentData,
            pointsReward: lesson.pointsReward,
            requiresReflection: lesson.requiresReflection,
            passingScore: lesson.passingScore,
            isCompleted: progress?.isCompleted || false,
            completedAt: progress?.completedAt,
        };

        if (lesson.lessonType === 'KEYWORDS') {
            const keywords = await this.keywordRepository.findByLessonId(lessonId);
            lessonResponse.keywords = keywords;
        }

        return lessonResponse;
    }
}