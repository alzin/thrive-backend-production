// backend/src/application/use-cases/course/GetCourseLessonsUseCase.ts
import { LessonRepository } from '../../../infrastructure/database/repositories/LessonRepository';
import { ProgressRepository } from '../../../infrastructure/database/repositories/ProgressRepository';
import { KeywordRepository } from '../../../infrastructure/database/repositories/KeywordRepository';

export interface GetCourseLessonsRequest {
    courseId: string;
    userId: string;
}

export class GetCourseLessonsUseCase {
    constructor(
        private lessonRepository: LessonRepository,
        private progressRepository: ProgressRepository,
        private keywordRepository: KeywordRepository
    ) { }

    async execute(request: GetCourseLessonsRequest): Promise<any[]> {
        const { courseId, userId } = request;

        const lessons = await this.lessonRepository.findByCourseId(courseId);
        const progress = await this.progressRepository.findByUserAndCourse(userId, courseId);

        const lessonsWithProgress = await Promise.all(lessons.map(async (lesson) => {
            const lessonProgress = progress.find(p => p.lessonId === lesson.id);

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
                isCompleted: lessonProgress?.isCompleted || false,
                completedAt: lessonProgress?.completedAt,
            };

            if (lesson.lessonType === 'KEYWORDS') {
                const keywords = await this.keywordRepository.findByLessonId(lesson.id);
                lessonResponse.keywords = keywords;
            }

            return lessonResponse;
        }));

        return lessonsWithProgress;
    }
}
