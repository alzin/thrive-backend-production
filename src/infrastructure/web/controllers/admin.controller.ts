import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Import use cases
import { GetUsersUseCase } from '../../../application/use-cases/admin/user-managment/GetUsersUseCase';
import { UpdateUserStatusUseCase } from '../../../application/use-cases/admin/user-managment/UpdateUserStatusUseCase';
import { ManagePointsUseCase } from '../../../application/use-cases/admin/user-managment/ManagePointsUseCase';

import { CreateCourseUseCase } from '../../../application/use-cases/admin/course-managment/CreateCourseUseCase';
import { UpdateCourseUseCase } from '../../../application/use-cases/admin/course-managment/UpdateCourseUseCase';
import { DeleteCourseUseCase } from '../../../application/use-cases/admin/course-managment/DeleteCourseUseCase';

import { CreateLessonUseCase } from '../../../application/use-cases/admin/lesson-managment/CreateLessonUseCase';
import { UpdateLessonUseCase } from '../../../application/use-cases/admin/lesson-managment/UpdateLessonUseCase';
import { DeleteLessonUseCase } from '../../../application/use-cases/admin/lesson-managment/DeleteLessonUseCase';
import { GetLessonWithKeywordsUseCase } from '../../../application/use-cases/admin/lesson-managment/GetLessonWithKeywordsUseCase';

import { CreateSingleSessionUseCase } from '../../../application/use-cases/admin/session-managment/CreateSingleSessionUseCase';
import { CreateRecurringSessionUseCase } from '../../../application/use-cases/admin/session-managment/CreateRecurringSessionUseCase';
import { UpdateSessionUseCase } from '../../../application/use-cases/admin/session-managment/UpdateSessionUseCase';
import { DeleteSessionUseCase } from '../../../application/use-cases/admin/session-managment/DeleteSessionUseCase';
import { GetSessionsWithPaginationUseCase } from '../../../application/use-cases/admin/session-managment/GetSessionsWithPaginationUseCase';
import { GetRecurringSessionDetailsUseCase } from '../../../application/use-cases/admin/session-managment/GetRecurringSessionDetailsUseCase';

import { GetFlaggedPostsUseCase } from '../../../application/use-cases/admin/post-managment/GetFlaggedPostsUseCase';
import { DeletePostUseCase } from '../../../application/use-cases/admin/post-managment/DeletePostUseCase';
import { UnflagPostUseCase } from '../../../application/use-cases/admin/post-managment/UnflagPostUseCase';

import { GetAnalyticsOverviewUseCase } from '../../../application/use-cases/admin/analytics-managment/GetAnalyticsOverviewUseCase';
import { GetRevenueAnalyticsUseCase } from '../../../application/use-cases/admin/analytics-managment/GetRevenueAnalyticsUseCase';
import { GetEngagementAnalyticsUseCase } from '../../../application/use-cases/admin/analytics-managment/GetEngagementAnalyticsUseCase';

import { CreatePostUseCase } from '../../../application/use-cases/community/CreatePostUseCase';

import { CreateLevelUseCase } from '../../../application/use-cases/admin/level-management/CreateLevelUseCase';
import { UpdateLevelUseCase } from '../../../application/use-cases/admin/level-management/UpdateLevelUseCase';
import { DeleteLevelUseCase } from '../../../application/use-cases/admin/level-management/DeleteLevelUseCase';
import { GetAllLevelsUseCase } from '../../../application/use-cases/level/GetAllLevelsUseCase';

import { CourseType } from '../../../domain/entities/Course';
import { SessionType } from '../../../domain/entities/Session';
import { LessonType } from '../../../domain/entities/Lesson';
export class AdminController {

  constructor(
    // User Management Use Cases
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly managePointsUseCase: ManagePointsUseCase,

    // Course Management Use Cases
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
    private readonly deleteCourseUseCase: DeleteCourseUseCase,

    // Lesson Management Use Cases
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly updateLessonUseCase: UpdateLessonUseCase,
    private readonly deleteLessonUseCase: DeleteLessonUseCase,
    private readonly getLessonWithKeywordsUseCase: GetLessonWithKeywordsUseCase,

    // Session Management Use Cases
    private readonly createSingleSessionUseCase: CreateSingleSessionUseCase,
    private readonly createRecurringSessionUseCase: CreateRecurringSessionUseCase,
    private readonly updateSessionUseCase: UpdateSessionUseCase,
    private readonly deleteSessionUseCase: DeleteSessionUseCase,
    private readonly getSessionsWithPaginationUseCase: GetSessionsWithPaginationUseCase,
    private readonly getRecurringSessionDetailsUseCase: GetRecurringSessionDetailsUseCase,

    // Post Management Use Cases
    private readonly getFlaggedPostsUseCase: GetFlaggedPostsUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly unflagPostUseCase: UnflagPostUseCase,

    // Analytics Use Cases
    private readonly getAnalyticsOverviewUseCase: GetAnalyticsOverviewUseCase,
    private readonly getRevenueAnalyticsUseCase: GetRevenueAnalyticsUseCase,
    private readonly getEngagementAnalyticsUseCase: GetEngagementAnalyticsUseCase,

    // Community Use Cases
    private readonly createPostUseCase: CreatePostUseCase,

    // Level Management Use Cases
    private readonly createLevelUseCase: CreateLevelUseCase,
    private readonly updateLevelUseCase: UpdateLevelUseCase,
    private readonly deleteLevelUseCase: DeleteLevelUseCase,
    private readonly getAllLevelsUseCase: GetAllLevelsUseCase
  ) { }

  // ========== USER MANAGEMENT ==========

  private parseArrayQuery(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        roles,
        statuses,
        subscriptions,
        languageLevels,
        dateFrom,
        dateTo,
        pointsMin,
        pointsMax,
        levelMin,
        levelMax,
        sortField,
        sortOrder,
      } = req.query;

      const result = await this.getUsersUseCase.execute({
        page: Number(page),
        limit: Number(limit),
        search: search ? String(search) : undefined,
        roles: this.parseArrayQuery(roles),
        statuses: this.parseArrayQuery(statuses),
        subscriptions: this.parseArrayQuery(subscriptions),
        languageLevels: this.parseArrayQuery(languageLevels),
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
        pointsMin: pointsMin !== undefined && pointsMin !== '' ? Number(pointsMin) : undefined,
        pointsMax: pointsMax !== undefined && pointsMax !== '' ? Number(pointsMax) : undefined,
        levelMin: levelMin !== undefined && levelMin !== '' ? Number(levelMin) : undefined,
        levelMax: levelMax !== undefined && levelMax !== '' ? Number(levelMax) : undefined,
        sortField: sortField as "joined" | "points" | "level" | "name" | undefined,
        sortOrder: sortOrder as "asc" | "desc" | undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const result = await this.updateUserStatusUseCase.execute(userId, isActive);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async adjustUserPoints(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { points, reason } = req.body;

      await this.managePointsUseCase.execute({
        adminId: req.user!.userId,
        targetUserId: userId,
        points,
        reason
      });

      res.json({ message: 'Points adjusted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ========== COURSE MANAGEMENT ==========

  async createCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, type, icon, freeLessonCount = 0, levelId } = req.body;

      const course = await this.createCourseUseCase.execute({
        title,
        description,
        type: type as CourseType,
        icon,
        freeLessonCount,
        levelId
      });

      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const updates = req.body;

      const updated = await this.updateCourseUseCase.execute(courseId, updates);
      res.json(updated);
    } catch (error: any) {
      if (error.message === 'Course not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const result = await this.deleteCourseUseCase.execute(courseId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Course not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // ========== LESSON MANAGEMENT ==========

  async createLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const lessonData = req.body;

      const lesson = await this.createLessonUseCase.execute({
        courseId,
        ...lessonData
      });

      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error in createLesson:', error);
      next(error);
    }
  }

  async updateLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const updates = req.body;

      const updated = await this.updateLessonUseCase.execute(lessonId, updates);
      res.json(updated);
    } catch (error: any) {
      if (error.message === 'Lesson not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const result = await this.deleteLessonUseCase.execute(lessonId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Lesson not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async getLessonWithKeywords(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const result = await this.getLessonWithKeywordsUseCase.execute(lessonId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Lesson not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // ========== SESSION MANAGEMENT ==========

  async createSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        title,
        description,
        type,
        hostId,
        meetingUrl,
        location,
        scheduledAt,
        duration,
        maxParticipants,
        pointsRequired,
        isRecurring,
        isActive,
        recurringWeeks
      } = req.body;

      // If it's a recurring session, use the recurring use case
      if (isRecurring && recurringWeeks && recurringWeeks > 1) {
        const sessions = await this.createRecurringSessionUseCase.execute({
          adminId: req.user!.userId,
          title,
          description,
          type: type as SessionType,
          hostId,
          meetingUrl,
          location,
          scheduledAt: new Date(scheduledAt),
          duration,
          maxParticipants,
          pointsRequired: pointsRequired || 0,
          isActive: isActive,
          recurringWeeks
        });

        res.status(201).json({
          message: `Created ${sessions.length} recurring sessions`,
          sessions: sessions,
          recurringInfo: {
            parentId: sessions[0].id,
            totalSessions: sessions.length,
            weeksCovered: recurringWeeks
          }
        });
      } else {
        // Create single session
        const session = await this.createSingleSessionUseCase.execute({
          title,
          description,
          type: type as SessionType,
          hostId: hostId || req.user!.userId,
          meetingUrl,
          location,
          scheduledAt: new Date(scheduledAt),
          duration,
          maxParticipants,
          pointsRequired: pointsRequired || 0,
          isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json(session);
      }
    } catch (error) {
      next(error);
    }
  }

  async updateSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const updates = req.body;

      const result = await this.updateSessionUseCase.execute({
        sessionId,
        updates,
        updateAllRecurring: updates.updateAllRecurring
      });

      res.json(result);
    } catch (error: any) {
      if (error.message === 'Session not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { deleteOption } = req.body;

      if (!deleteOption) {
        res.status(400).json({
          error: 'Delete option is required',
          message: 'Please specify how you want to delete this session'
        });
        return;
      }

      const result = await this.deleteSessionUseCase.execute({
        adminId: req.user!.userId,
        sessionId,
        deleteOption
      });

      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      res.status(400).json({
        error: error.message || 'Failed to delete session'
      });
    }
  }

  async getDeleteOptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const options = await this.deleteSessionUseCase.getDeleteOptions(sessionId);
      res.json(options);
    } catch (error: any) {
      console.error('Failed to get delete options:', error);
      res.status(400).json({
        error: error.message || 'Failed to get delete options'
      });
    }
  }

  async getSessionsWithPagination(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, type, isActive, isRecurring } = req.query;

      const result = await this.getSessionsWithPaginationUseCase.execute({
        page: Number(page),
        limit: Number(limit),
        type: type as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        isRecurring: isRecurring !== undefined ? isRecurring === 'true' : undefined
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRecurringSessionDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const result = await this.getRecurringSessionDetailsUseCase.execute(sessionId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Session not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // ========== POST MANAGEMENT ==========

  async getFlaggedPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const posts = await this.getFlaggedPostsUseCase.execute();
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const result = await this.deletePostUseCase.execute(postId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async unflagPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const result = await this.unflagPostUseCase.execute(postId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ========== ANALYTICS ==========

  async getAnalyticsOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analyticsData = await this.getAnalyticsOverviewUseCase.execute();
      res.json(analyticsData);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const revenueData = await this.getRevenueAnalyticsUseCase.execute();
      res.json(revenueData);
    } catch (error) {
      next(error);
    }
  }

  async getEngagementAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const engagementData = await this.getEngagementAnalyticsUseCase.execute();
      res.json(engagementData);
    } catch (error) {
      next(error);
    }
  }

  // ========== ANNOUNCEMENTS ==========

  async createAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;

      const post = await this.createPostUseCase.execute({
        userId: req.user!.userId,
        content,
      });

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

  // ========== LEVEL MANAGEMENT ==========

  async getAllLevels(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const levels = await this.getAllLevelsUseCase.execute();
      res.json(levels);
    } catch (error) {
      next(error);
    }
  }

  async createLevel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      const level = await this.createLevelUseCase.execute({ name, description });
      res.status(201).json(level);
    } catch (error) {
      next(error);
    }
  }

  async updateLevel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { levelId } = req.params;
      const updates = req.body;
      const updated = await this.updateLevelUseCase.execute(levelId, updates);
      res.json(updated);
    } catch (error: any) {
      if (error.message === 'Level not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteLevel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { levelId } = req.params;
      const result = await this.deleteLevelUseCase.execute(levelId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Level not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

}