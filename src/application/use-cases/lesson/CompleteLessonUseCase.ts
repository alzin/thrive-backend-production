// backend/src/application/use-cases/lesson/CompleteLessonUseCase.ts
import { ILessonRepository } from '../../../domain/repositories/ILessonRepository';
import { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { Progress } from '../../../domain/entities/Progress';
import { ActivityService } from '../../../infrastructure/services/ActivityService';

export interface CompleteLessonDTO {
  userId: string;
  lessonId: string;
  reflectionContent?: string;
  quizScore?: number;
}

export class CompleteLessonUseCase {
  constructor(
    private lessonRepository: ILessonRepository,
    private progressRepository: IProgressRepository,
    private profileRepository: IProfileRepository,
    private activityService: ActivityService
  ) { }

  async execute(dto: CompleteLessonDTO): Promise<Progress> {
    const lesson = await this.lessonRepository.findById(dto.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if reflection is required
    if (lesson.requiresReflection && !dto.reflectionContent) {
      throw new Error('Reflection is required for this lesson');
    }

    // Check if quiz score meets passing criteria
    if (lesson.lessonType === 'QUIZ' && lesson.passingScore) {
      if (!dto.quizScore || dto.quizScore < lesson.passingScore) {
        throw new Error(`Quiz score must be at least ${lesson.passingScore}% to complete this lesson`);
      }
    }

    // Check existing progress
    let progress = await this.progressRepository.findByUserAndLesson(dto.userId, dto.lessonId);

    if (progress) {
      if (progress.isCompleted) {
        throw new Error('Lesson already completed');
      }
      progress.markAsCompleted();
      if (lesson.requiresReflection) {
        progress.reflectionSubmitted = true;
      }
      if (dto.quizScore !== undefined) {
        progress.quizScore = dto.quizScore;
      }
    } else {
      progress = new Progress(
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        dto.userId,
        dto.lessonId,
        lesson.courseId,
        true,
        new Date(),
        lesson.requiresReflection,
        dto.quizScore,
        new Date(),
        new Date()
      );
    }

    const savedProgress = await this.progressRepository.update(progress);

    // Award points
    if (lesson.pointsReward > 0) {
      await this.profileRepository.updatePoints(dto.userId, lesson.pointsReward);
    }

    // #activity
    await this.activityService.logLessonCompleted(
      dto.userId,
      lesson.title,
      lesson.pointsReward
    );

    return savedProgress;
  }
}