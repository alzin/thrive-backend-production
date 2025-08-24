// backend/src/infrastructure/web/controllers/course.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CourseRepository } from '../../database/repositories/CourseRepository';
import { LessonRepository } from '../../database/repositories/LessonRepository';
import { ProgressRepository } from '../../database/repositories/ProgressRepository';
import { KeywordRepository } from '../../database/repositories/KeywordRepository';
import { CompleteLessonUseCase } from '../../../application/use-cases/lesson/CompleteLessonUseCase';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { EnrollInCourseUseCase } from '../../../application/use-cases/course/EnrollInCourseUseCase';
import { EnrollmentRepository } from '../../database/repositories/EnrollmentRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { Keyword } from '../../../domain/entities/Keyword';
import { ActivityService } from '../../services/ActivityService';

export class CourseController {
  async getAllCourses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseRepository = new CourseRepository();
      const getOnlyActive = req.user?.role !== "ADMIN" ? true : undefined

      const courses = await courseRepository.findAllWithLessonCounts(getOnlyActive);
      res.json(courses);
    } catch (error) {
      next(error);
    }
  }

  async getCourseById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const courseRepository = new CourseRepository();
      const course = await courseRepository.findById(courseId);

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      res.json(course);
    } catch (error) {
      next(error);
    }
  }

  async getCourseLessons(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const lessonRepository = new LessonRepository();
      const progressRepository = new ProgressRepository();
      const keywordRepository = new KeywordRepository();

      const lessons = await lessonRepository.findByCourseId(courseId);
      const progress = await progressRepository.findByUserAndCourse(req.user!.userId, courseId);

      const lessonsWithProgress = await Promise.all(lessons.map(async (lesson) => {
        const lessonProgress = progress.find(p => p.lessonId === lesson.id);

        // Create the response object with all necessary fields
        const lessonResponse: any = {
          id: lesson.id,
          courseId: lesson.courseId,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          lessonType: lesson.lessonType,
          contentUrl: lesson.contentUrl,
          contentData: lesson.contentData, // Include contentData
          pointsReward: lesson.pointsReward,
          requiresReflection: lesson.requiresReflection,
          passingScore: lesson.passingScore, // Include passingScore
          isCompleted: lessonProgress?.isCompleted || false,
          completedAt: lessonProgress?.completedAt,
        };

        // Fetch keywords if lesson type is KEYWORDS
        if (lesson.lessonType === 'KEYWORDS') {
          const keywords = await keywordRepository.findByLessonId(lesson.id);
          lessonResponse.keywords = keywords;
        }

        return lessonResponse;
      }));

      res.json(lessonsWithProgress);
    } catch (error) {
      console.error('Error in getCourseLessons:', error);
      next(error);
    }
  }

  async completeLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { reflectionContent, quizScore } = req.body || {};

      const completeLessonUseCase = new CompleteLessonUseCase(
        new LessonRepository(),
        new ProgressRepository(),
        new ProfileRepository(),
        new ActivityService()
      );

      const progress = await completeLessonUseCase.execute({
        userId: req.user!.userId,
        lessonId,
        reflectionContent,
        quizScore
      });

      res.json({ message: 'Lesson completed successfully', progress });
    } catch (error) {
      next(error);
    }
  }

  async enrollInCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;

      const enrollmentRepository = new EnrollmentRepository();
      const enrollInCourseUseCase = new EnrollInCourseUseCase(
        new CourseRepository(),
        enrollmentRepository,
        new UserRepository()
      );

      const enrollment = await enrollInCourseUseCase.execute({
        userId: req.user!.userId,
        courseId
      });

      res.status(201).json({
        message: 'Successfully enrolled in course',
        enrollment
      });
    } catch (error: any) {
      if (error.message.includes('Already enrolled')) {
        res.status(409).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async getMyEnrollments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollmentRepository = new EnrollmentRepository();
      const enrollments = await enrollmentRepository.findByUserId(req.user!.userId);

      // Get course details for each enrollment
      const courseRepository = new CourseRepository();
      const enrollmentsWithCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await courseRepository.findById(enrollment.courseId);
          return { ...enrollment, course };
        })
      );

      res.json(enrollmentsWithCourses);
    } catch (error) {
      next(error);
    }
  }

  async checkEnrollment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const enrollmentRepository = new EnrollmentRepository();

      const enrollment = await enrollmentRepository.findByUserAndCourse(
        req.user!.userId,
        courseId
      );

      res.json({ isEnrolled: !!enrollment });
    } catch (error) {
      next(error);
    }
  }

  async getLessonById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const lessonRepository = new LessonRepository();
      const keywordRepository = new KeywordRepository();
      const progressRepository = new ProgressRepository();

      const lesson = await lessonRepository.findById(lessonId);
      if (!lesson) {
        res.status(404).json({ error: 'Lesson not found' });
        return;
      }

      // Check progress
      const progress = await progressRepository.findByUserAndLesson(req.user!.userId, lessonId);

      // Build response object
      const lessonResponse: any = {
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        lessonType: lesson.lessonType,
        contentUrl: lesson.contentUrl,
        contentData: lesson.contentData, // Include contentData
        pointsReward: lesson.pointsReward,
        requiresReflection: lesson.requiresReflection,
        passingScore: lesson.passingScore, // Include passingScore
        isCompleted: progress?.isCompleted || false,
        completedAt: progress?.completedAt,
      };

      // Fetch keywords if lesson type is KEYWORDS
      if (lesson.lessonType === 'KEYWORDS') {
        const keywords = await keywordRepository.findByLessonId(lessonId);
        lessonResponse.keywords = keywords;
      }

      res.json(lessonResponse);
    } catch (error) {
      next(error);
    }
  }
}