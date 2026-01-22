import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { GetAllCoursesUseCase } from '../../../application/use-cases/course/GetAllCoursesUseCase';
import { GetCourseByIdUseCase } from '../../../application/use-cases/course/GetCourseByIdUseCase';
import { GetCourseLessonsUseCase } from '../../../application/use-cases/course/GetCourseLessonsUseCase';
import { CompleteLessonUseCase } from '../../../application/use-cases/course/CompleteLessonUseCase';
import { EnrollInCourseUseCase } from '../../../application/use-cases/course/EnrollInCourseUseCase';
import { GetMyEnrollmentsUseCase } from '../../../application/use-cases/course/GetMyEnrollmentsUseCase';
import { CheckEnrollmentUseCase } from '../../../application/use-cases/course/CheckEnrollmentUseCase';
import { GetLessonByIdUseCase } from '../../../application/use-cases/course/GetLessonByIdUseCase';

export class CourseController {
  constructor(
    private getAllCoursesUseCase: GetAllCoursesUseCase,
    private getCourseByIdUseCase: GetCourseByIdUseCase,
    private getCourseLessonsUseCase: GetCourseLessonsUseCase,
    private completeLessonUseCase: CompleteLessonUseCase,
    private enrollInCourseUseCase: EnrollInCourseUseCase,
    private getMyEnrollmentsUseCase: GetMyEnrollmentsUseCase,
    private checkEnrollmentUseCase: CheckEnrollmentUseCase,
    private getLessonByIdUseCase: GetLessonByIdUseCase
  ) { }

  async getAllCourses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const courses = await this.getAllCoursesUseCase.execute({
        userRole: req.user?.role
      });

      res.json(courses);
    } catch (error) {
      next(error);
    }
  }

  async getCourseById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;

      const course = await this.getCourseByIdUseCase.execute({ courseId });

      res.json(course);
    } catch (error) {
      if (error instanceof Error && error.message === 'Course not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async getCourseLessons(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;

      const lessonsWithProgress = await this.getCourseLessonsUseCase.execute({
        courseId,
        userId: req.user!.userId
      });

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

      const progress = await this.completeLessonUseCase.execute({
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

      const enrollment = await this.enrollInCourseUseCase.execute({
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
      const enrollmentsWithCourses = await this.getMyEnrollmentsUseCase.execute({
        userId: req.user!.userId
      });

      res.json(enrollmentsWithCourses);
    } catch (error) {
      next(error);
    }
  }

  async checkEnrollment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;

      const result = await this.checkEnrollmentUseCase.execute({
        userId: req.user!.userId,
        courseId
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLessonById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;

      const lessonResponse = await this.getLessonByIdUseCase.execute({
        lessonId,
        userId: req.user!.userId
      });

      res.json(lessonResponse);
    } catch (error) {
      if (error instanceof Error && error.message === 'Lesson not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
}