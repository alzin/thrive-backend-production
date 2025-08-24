// backend/src/infrastructure/web/controllers/publicProfile.controller.ts (Fixed version)
import { Request, Response, NextFunction } from 'express';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ProgressRepository } from '../../database/repositories/ProgressRepository';
import { PostRepository } from '../../database/repositories/PostRepository';
import { LessonRepository } from '../../database/repositories/LessonRepository';
import { CourseRepository } from '../../database/repositories/CourseRepository';
import { EnrollmentRepository } from '../../database/repositories/EnrollmentRepository';
import { BookingRepository } from '../../database/repositories/BookingRepository';
import { SessionRepository } from '../../database/repositories/SessionRepository';
import { Progress } from '../../../domain/entities/Progress';
import { Post } from '../../../domain/entities/Post';
import { Booking } from '../../../domain/repositories/IBookingRepository';
import { RecentActivityRepository } from '../../database/repositories/RecentActivityRepository';
import { RecentActivity } from '../../../domain/entities/RecentActivity';

export interface PublicProfileData {
  id: string;
  name: string;
  bio?: string;
  profilePhoto?: string;
  languageLevel?: string;
  level: number;
  badges: string[];
  createdAt: string;
  // Real user stats
  totalLessonsCompleted: number;
  totalLessonsAvailable: number;
  totalPoints: number;
  joinedDaysAgo: number;
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  communityPosts: number;
  sessionsAttended: number;
  // Achievements based on real data
  publicAchievements: Array<{
    id: string;
    title: string;
    icon: string;
    description: string;
    unlockedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
  // Learning stats based on actual progress
  learningStats: Array<{
    skill: string;
    level: number;
    color: string;
  }>;
  // Real recent milestones
  recentMilestones: RecentActivity[];
  // Course progress
  courseProgress: Array<{
    courseTitle: string;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
  }>;
}

export class PublicProfileController {
  private profileRepository: ProfileRepository;
  private userRepository: UserRepository;
  private progressRepository: ProgressRepository;
  private postRepository: PostRepository;
  private lessonRepository: LessonRepository;
  private courseRepository: CourseRepository;
  private enrollmentRepository: EnrollmentRepository;
  private bookingRepository: BookingRepository;
  private sessionRepository: SessionRepository;
  private recentActivityRepository: RecentActivityRepository


  constructor() {
    this.profileRepository = new ProfileRepository();
    this.userRepository = new UserRepository();
    this.progressRepository = new ProgressRepository();
    this.postRepository = new PostRepository();
    this.lessonRepository = new LessonRepository();
    this.courseRepository = new CourseRepository();
    this.enrollmentRepository = new EnrollmentRepository();
    this.bookingRepository = new BookingRepository();
    this.sessionRepository = new SessionRepository();
    this.recentActivityRepository = new RecentActivityRepository();

  }

  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      // Get user and profile data
      const user = await this.userRepository.findById(userId);
      if (!user || !user.isActive) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const profile = await this.profileRepository.findByUserId(userId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Calculate days since joining
      const joinedDate = new Date(user.createdAt);
      const joinedDaysAgo = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get user enrollments FIRST
      const enrollments = await this.enrollmentRepository.findByUserId(userId);
      const enrolledCourses = enrollments.length;

      // Get total lessons available and completed ONLY from enrolled courses
      let totalLessonsAvailable = 0;
      let totalLessonsCompleted = 0;
      const courseProgress = [];
      let completedCourses = 0;

      for (const enrollment of enrollments) {
        const course = await this.courseRepository.findById(enrollment.courseId);
        if (course && course.isActive) {
          const lessons = await this.lessonRepository.findByCourseId(course.id);
          const completedLessons = await this.progressRepository.getCompletedLessonCount(userId, course.id);

          // Add to totals
          totalLessonsAvailable += lessons.length;
          totalLessonsCompleted += completedLessons;

          const progressPercentage = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

          if (progressPercentage === 100) {
            completedCourses++;
          }

          courseProgress.push({
            courseTitle: course.title,
            totalLessons: lessons.length,
            completedLessons,
            progressPercentage,
          });
        }
      }

      // Get user progress ONLY from enrolled courses with proper typing
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      let userProgress: Progress[] = [];

      for (const courseId of enrolledCourseIds) {
        const courseProgress = await this.progressRepository.findByUserAndCourse(userId, courseId);
        userProgress.push(...courseProgress);
      }

      // Get total courses count (all available courses)
      const allCourses = await this.courseRepository.findAll(true);

      // Get community activity
      const userPosts = await this.postRepository.findByUserId(userId);
      const communityPosts = userPosts.length;

      // Get session attendance
      const userBookings = await this.bookingRepository.findByUserId(userId);
      const sessionsAttended = userBookings.filter(b => b.status === 'COMPLETED').length;

      // Generate achievements based on real data
      const publicAchievements = await this.generateRealAchievements(
        userId,
        totalLessonsCompleted,
        communityPosts,
        profile.points,
        joinedDaysAgo,
        completedCourses,
        sessionsAttended,
        user.createdAt
      );

      // Generate learning stats based on actual progress
      const learningStats = this.generateRealLearningStats(
        totalLessonsCompleted,
        totalLessonsAvailable,
        profile.level,
        completedCourses,
        enrolledCourses,
        communityPosts,
        sessionsAttended
      );

      // Generate recent milestones based on real activity
      const recentMilestones = await this.recentActivityRepository.findByUserId(
        userId,
        100
      );

      //  const recentMilestones = await this.generateRealMilestones(
      //   userId,
      //   userProgress,
      //   userPosts,
      //   userBookings,
      //   completedCourses
      // );

      const publicProfileData: PublicProfileData = {
        id: profile.id,
        name: profile.name,
        bio: profile.bio || undefined,
        profilePhoto: profile.profilePhoto || undefined,
        languageLevel: profile.languageLevel || undefined,
        level: profile.level,
        badges: profile.badges,
        createdAt: user.createdAt.toISOString(),
        totalLessonsCompleted,
        totalLessonsAvailable, // Now only from enrolled courses
        totalPoints: profile.points,
        joinedDaysAgo,
        totalCourses: allCourses.length,
        enrolledCourses,
        completedCourses,
        communityPosts,
        sessionsAttended,
        publicAchievements,
        learningStats,
        recentMilestones,
        courseProgress,
      };

      res.json(publicProfileData);
    } catch (error) {
      next(error);
    }
  }

  private async generateRealAchievements(
    userId: string,
    lessonsCompleted: number,
    postsCount: number,
    points: number,
    daysLearning: number,
    completedCourses: number,
    sessionsAttended: number,
    joinDate: Date
  ) {
    const achievements = [];

    // Welcome Achievement - Always unlocked
    achievements.push({
      id: 'welcome',
      title: 'Welcome!',
      icon: '👋',
      description: 'Started your Japanese learning journey',
      unlockedAt: joinDate.toISOString(),
      rarity: 'common' as const,
    });

    // First Lesson Achievement
    if (lessonsCompleted >= 1) {
      achievements.push({
        id: 'first-lesson',
        title: 'First Steps',
        icon: '🌸',
        description: 'Completed your first lesson',
        unlockedAt: new Date(joinDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'common' as const,
      });
    }

    // Lesson Milestones
    if (lessonsCompleted >= 10) {
      achievements.push({
        id: 'lesson-explorer',
        title: 'Lesson Explorer',
        icon: '📚',
        description: 'Completed 10 lessons',
        unlockedAt: new Date(joinDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'common' as const,
      });
    }

    if (lessonsCompleted >= 25) {
      achievements.push({
        id: 'dedicated-learner',
        title: 'Dedicated Learner',
        icon: '🎯',
        description: 'Completed 25 lessons',
        unlockedAt: new Date(joinDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'rare' as const,
      });
    }

    if (lessonsCompleted >= 50) {
      achievements.push({
        id: 'lesson-master',
        title: 'Lesson Master',
        icon: '🏆',
        description: 'Completed 50 lessons',
        unlockedAt: new Date(joinDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'epic' as const,
      });
    }

    if (lessonsCompleted >= 100) {
      achievements.push({
        id: 'century-learner',
        title: 'Century Learner',
        icon: '💯',
        description: 'Completed 100 lessons',
        unlockedAt: new Date(joinDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'legendary' as const,
      });
    }

    // Community Achievements
    if (postsCount >= 1) {
      achievements.push({
        id: 'first-post',
        title: 'Community Member',
        icon: '💬',
        description: 'Made your first community post',
        unlockedAt: new Date(joinDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'common' as const,
      });
    }

    if (postsCount >= 10) {
      achievements.push({
        id: 'active-member',
        title: 'Active Member',
        icon: '🗣️',
        description: 'Made 10 community posts',
        unlockedAt: new Date(joinDate.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'rare' as const,
      });
    }

    // Points Achievements
    if (points >= 100) {
      achievements.push({
        id: 'first-hundred',
        title: 'Point Collector',
        icon: '⭐',
        description: 'Earned 100 points',
        unlockedAt: new Date(joinDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'common' as const,
      });
    }

    if (points >= 500) {
      achievements.push({
        id: 'point-master',
        title: 'Point Master',
        icon: '🌟',
        description: 'Earned 500 points',
        unlockedAt: new Date(joinDate.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'rare' as const,
      });
    }

    if (points >= 1000) {
      achievements.push({
        id: 'point-legend',
        title: 'Point Legend',
        icon: '✨',
        description: 'Earned 1000 points',
        unlockedAt: new Date(joinDate.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'epic' as const,
      });
    }

    // Course Completion Achievements
    if (completedCourses >= 1) {
      achievements.push({
        id: 'course-complete',
        title: 'Course Finisher',
        icon: '🎓',
        description: 'Completed your first course',
        unlockedAt: new Date(joinDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'rare' as const,
      });
    }

    if (completedCourses >= 3) {
      achievements.push({
        id: 'multi-course',
        title: 'Multi-Course Master',
        icon: '📖',
        description: 'Completed 3 courses',
        unlockedAt: new Date(joinDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'epic' as const,
      });
    }

    // Session Attendance Achievements
    if (sessionsAttended >= 1) {
      achievements.push({
        id: 'first-session',
        title: 'Session Participant',
        icon: '🎤',
        description: 'Attended your first speaking session',
        unlockedAt: new Date(joinDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'rare' as const,
      });
    }

    if (sessionsAttended >= 5) {
      achievements.push({
        id: 'session-regular',
        title: 'Session Regular',
        icon: '🗣️',
        description: 'Attended 5 speaking sessions',
        unlockedAt: new Date(joinDate.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'epic' as const,
      });
    }

    // Consistency Achievements
    if (daysLearning >= 7) {
      achievements.push({
        id: 'week-warrior',
        title: 'Week Warrior',
        icon: '🔥',
        description: 'Learning for 7 days',
        unlockedAt: new Date(joinDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'rare' as const,
      });
    }

    if (daysLearning >= 30) {
      achievements.push({
        id: 'month-master',
        title: 'Month Master',
        icon: '📅',
        description: 'Learning for 30 days',
        unlockedAt: new Date(joinDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'epic' as const,
      });
    }

    return achievements.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
  }

  private generateRealLearningStats(
    lessonsCompleted: number,
    totalLessons: number,
    level: number,
    completedCourses: number,
    enrolledCourses: number,
    communityPosts: number,
    sessionsAttended: number
  ) {
    // Calculate base progress based on actual lesson completion
    const lessonProgress = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;
    const levelBonus = level * 3; // Each level adds 3% bonus

    // Calculate different skills based on different activities
    const vocabularyProgress = Math.min(lessonProgress + levelBonus + (completedCourses * 5), 95);
    const grammarProgress = Math.min(lessonProgress + levelBonus + (completedCourses * 5), 95);
    const listeningProgress = Math.min(lessonProgress * 0.8 + levelBonus + (sessionsAttended * 3), 95);
    const speakingProgress = Math.min(lessonProgress * 0.6 + levelBonus + (sessionsAttended * 5), 95);
    const readingProgress = Math.min(lessonProgress + levelBonus + (communityPosts * 2), 95);

    return [
      {
        skill: 'Vocabulary',
        level: Math.round(vocabularyProgress),
        color: '#5C633A',
      },
      {
        skill: 'Grammar',
        level: Math.round(grammarProgress),
        color: '#A6531C',
      },
      {
        skill: 'Listening',
        level: Math.round(listeningProgress),
        color: '#D4BC8C',
      },
      {
        skill: 'Speaking',
        level: Math.round(speakingProgress),
        color: '#483C32',
      },
      {
        skill: 'Reading',
        level: Math.round(readingProgress),
        color: '#FFA502',
      },
    ];
  }

  private async generateRealMilestones(
    userId: string,
    userProgress: Progress[],
    userPosts: Post[],
    userBookings: Booking[],
    completedCourses: number
  ) {
    const milestones = [];

    try {
      // Get recent completed lessons
      const recentCompletedLessons = userProgress
        .filter(p => p.isCompleted && p.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 3);

      for (const progress of recentCompletedLessons) {
        try {
          const lesson = await this.lessonRepository.findById(progress.lessonId);
          if (lesson) {
            milestones.push({
              title: `Completed "${lesson.title}"`,
              date: this.getRelativeTime(new Date(progress.completedAt!)),
              type: 'lesson' as const,
              details: `Earned ${lesson.pointsReward} points`,
            });
          }
        } catch (error) {
          console.warn(`Could not fetch lesson ${progress.lessonId}:`, error);
          // Skip if lesson not found
        }
      }

      // Get recent posts
      const recentPosts = userPosts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);

      for (const post of recentPosts) {
        milestones.push({
          title: 'Posted in Community',
          date: this.getRelativeTime(new Date(post.createdAt)),
          type: 'community' as const,
          details: post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content,
        });
      }

      // Get recent session attendance (from completed bookings)
      const completedSessions = userBookings
        .filter(b => b.status === 'COMPLETED')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 2);

      for (const booking of completedSessions) {
        try {
          const session = await this.sessionRepository.findById(booking.sessionId);
          if (session) {
            milestones.push({
              title: `Attended "${session.title}"`,
              date: this.getRelativeTime(new Date(booking.updatedAt)),
              type: 'achievement' as const,
              details: `${session.type} session`,
            });
          }
        } catch (error) {
          console.warn(`Could not fetch session ${booking.sessionId}:`, error);
          // Skip if session not found
        }
      }

      // Add course completion milestones (if any)
      if (completedCourses > 0) {
        // Estimate completion date based on most recent lesson completion
        let completionDate = new Date();
        if (recentCompletedLessons.length > 0) {
          completionDate = new Date(recentCompletedLessons[0].completedAt!);
        } else {
          // Fallback to a week ago
          completionDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        }

        milestones.push({
          title: `Completed ${completedCourses} Course${completedCourses > 1 ? 's' : ''}`,
          date: this.getRelativeTime(completionDate),
          type: 'course' as const,
          details: 'Course mastery achieved',
        });
      }

      // Add level up milestones (estimate based on recent activity)
      if (recentCompletedLessons.length > 0) {
        const profile = await this.profileRepository.findByUserId(userId);
        if (profile && profile.level > 1) {
          // Estimate when they might have leveled up
          const levelUpDate = new Date(Date.now() - (profile.level - 1) * 7 * 24 * 60 * 60 * 1000);
          milestones.push({
            title: `Reached Level ${profile.level}`,
            date: this.getRelativeTime(levelUpDate),
            type: 'level' as const,
            details: 'Level up achieved!',
          });
        }
      }

    } catch (error) {
      console.error('Error generating milestones:', error);
      // Return fallback milestones
      milestones.push({
        title: 'Started Learning Journey',
        date: '1 week ago',
        type: 'achievement' as const,
        details: 'Welcome to Japanese learning!',
      });
    }

    // Sort by most recent first and return top 4
    return milestones
      .sort((a, b) => {
        const dateA = this.parseDateFromRelativeTime(a.date);
        const dateB = this.parseDateFromRelativeTime(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 4);
  }

  private getRelativeTime(date: Date): string {
    try {
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return 'just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      if (diffInDays === 1) return '1 day ago';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 14) return '1 week ago';
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
      if (diffInDays < 60) return '1 month ago';
      return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return 'recently';
    }
  }

  private parseDateFromRelativeTime(relativeTime: string): Date {
    try {
      const now = new Date();

      if (relativeTime === 'just now') {
        return now;
      }

      // Extract number and unit from strings like "5 minutes ago", "2 days ago", etc.
      const match = relativeTime.match(/(\d+)\s+(minute|hour|day|week|month)s?\s+ago/);
      if (!match) {
        // Fallback for unmatched patterns
        return new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      }

      const [, numberStr, unit] = match;
      const number = parseInt(numberStr, 10);

      switch (unit) {
        case 'minute':
          return new Date(now.getTime() - number * 60 * 1000);
        case 'hour':
          return new Date(now.getTime() - number * 60 * 60 * 1000);
        case 'day':
          return new Date(now.getTime() - number * 24 * 60 * 60 * 1000);
        case 'week':
          return new Date(now.getTime() - number * 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now.getTime() - number * 30 * 24 * 60 * 60 * 1000);
        default:
          return new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 1 day ago
      }
    } catch (error) {
      console.error('Error parsing relative time:', error);
      return new Date(); // Return current time as fallback
    }
  }
}