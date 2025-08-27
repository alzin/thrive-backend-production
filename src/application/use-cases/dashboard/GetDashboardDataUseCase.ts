// backend/src/application/use-cases/dashboard/GetDashboardDataUseCase.ts (Fixed version)
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { ILessonRepository } from '../../../domain/repositories/ILessonRepository';
import { IPostRepository } from '../../../domain/repositories/IPostRepository';
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { IBookingRepository } from '../../../domain/repositories/IBookingRepository';
import { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import { IRecentActivityRepository } from '../../../domain/repositories/IRecentActivityRepository';
import { RecentActivity } from '../../../domain/entities/RecentActivity';

export interface DashboardDataDTO {
    userId: string;
}

export interface CourseProgress {
    courseId: string;
    courseTitle: string;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
}

export interface Achievement {
    id: string;
    badge: string;
    title: string;
    earnedAt: Date;
}

export interface DashboardStats {
    totalLessonsCompleted: number;
    totalLessonsAvailable: number;
    totalPoints: number;
    communityPostsCount: number;
    upcomingSessionsCount: number;
}

export interface DashboardData {
    user: {
        id: string;
        email: string;
        role: string;
        name?: string;
        profilePhoto?: string;
        level: number;
        languageLevel?: string;
    };
    stats: DashboardStats;
    courseProgress: CourseProgress[];
    recentActivity: RecentActivity[];
    achievements: Achievement[];
    upcomingSessions: Array<{
        id: string;
        title: string;
        scheduledAt: Date;
        type: string;
    }>;
}

export class GetDashboardDataUseCase {
    constructor(
        private userRepository: IUserRepository,
        private profileRepository: IProfileRepository,
        private progressRepository: IProgressRepository,
        private courseRepository: ICourseRepository,
        private lessonRepository: ILessonRepository,
        private postRepository: IPostRepository,
        private sessionRepository: ISessionRepository,
        private bookingRepository: IBookingRepository,
        private enrollmentRepository: IEnrollmentRepository,
        private activityRepository: IRecentActivityRepository,
    ) { }

    async execute(dto: DashboardDataDTO): Promise<DashboardData> {
        // Get user and profile data
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new Error('User not found');
        }

        const profile = await this.profileRepository.findByUserId(dto.userId);

        // Get user's enrollments FIRST
        const enrollments = await this.enrollmentRepository.findByUserId(dto.userId);

        // Calculate course progress for enrolled courses ONLY
        const courseProgress: CourseProgress[] = [];
        let totalLessonsCompleted = 0;
        let totalLessonsAvailable = 0;

        for (const enrollment of enrollments) {
            const course = await this.courseRepository.findById(enrollment.courseId);
            if (course && course.isActive) {
                const lessons = await this.lessonRepository.findByCourseId(course.id);
                const completedLessons = await this.progressRepository.getCompletedLessonCount(
                    dto.userId,
                    course.id
                );


                totalLessonsAvailable += lessons.length;
                totalLessonsCompleted += completedLessons;

                courseProgress.push({
                    courseId: course.id,
                    courseTitle: course.title,
                    totalLessons: lessons.length,
                    completedLessons,
                    progressPercentage: lessons.length > 0
                        ? Math.round((completedLessons / lessons.length) * 100)
                        : 0,
                });
            }
        }

        // Get community posts count
        const userPosts = await this.postRepository.findByUserId(dto.userId);
        const communityPostsCount = userPosts.length;

        // Get upcoming sessions
        const userBookings = await this.bookingRepository.findActiveByUserId(dto.userId);
        const upcomingSessionsData = [];

        for (const booking of userBookings) {
            const session = await this.sessionRepository.findById(booking.sessionId);
            if (session && new Date(session.scheduledAt) > new Date()) {
                upcomingSessionsData.push({
                    id: session.id,
                    title: session.title,
                    scheduledAt: session.scheduledAt,
                    type: session.type,
                });
            }
        }

        // Get recent activity (only from enrolled courses)
        const recentActivity: RecentActivity[] = await this.activityRepository.findByUserId(
            dto.userId,
            10
        );

        // Get achievements
        const achievements = this.calculateAchievements(
            profile,
            totalLessonsCompleted,
            communityPostsCount
        );

        // Compile dashboard data
        const dashboardData: DashboardData = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: profile?.name,
                profilePhoto: profile?.profilePhoto,
                level: profile?.level || 1,
                languageLevel: profile?.languageLevel,
            },
            stats: {
                totalLessonsCompleted,
                totalLessonsAvailable,
                totalPoints: profile?.points || 0,
                communityPostsCount,
                upcomingSessionsCount: upcomingSessionsData.length,
            },
            courseProgress,
            recentActivity,
            achievements,
            upcomingSessions: upcomingSessionsData.sort(
                (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
            ),
        };

        return dashboardData;
    }

    // private async getRecentActivity(userId: string, enrollments: any[]): Promise<RecentActivity[]> {
    //     const activities: RecentActivity[] = [];

    //     // Get recent completed lessons from ENROLLED COURSES ONLY
    //     const enrolledCourseIds = enrollments.map(e => e.courseId);

    //     for (const courseId of enrolledCourseIds) {
    //         const courseProgress = await this.progressRepository.findByUserAndCourse(userId, courseId);
    //         const completedProgress = courseProgress
    //             .filter(p => p.isCompleted && p.completedAt)
    //             .sort((a, b) => {
    //                 const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    //                 const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    //                 return dateB - dateA;
    //             })
    //             .slice(0, 3); // Get top 3 recent lessons per course

    //         for (const progress of completedProgress) {
    //             const lesson = await this.lessonRepository.findById(progress.lessonId);
    //             if (lesson) {
    //                 activities.push({
    //                     type: 'lesson_completed',
    //                     title: `Completed ${lesson.title}`,
    //                     timestamp: progress.completedAt!,
    //                 });

    //                 if (lesson.pointsReward > 0) {
    //                     activities.push({
    //                         type: 'points_earned',
    //                         title: `Earned ${lesson.pointsReward} points`,
    //                         timestamp: progress.completedAt!,
    //                     });
    //                 }
    //             }
    //         }
    //     }

    //     // Get recent posts
    //     const recentPosts = await this.postRepository.findByUserId(userId);
    //     const sortedPosts = recentPosts
    //         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    //         .slice(0, 3);

    //     for (const post of sortedPosts) {
    //         activities.push({
    //             type: 'post_created',
    //             title: 'Posted in community',
    //             timestamp: post.createdAt,
    //         });
    //     }

    //     // Get recent bookings
    //     const recentBookings = await this.bookingRepository.findByUserId(userId);
    //     const sortedBookings = recentBookings
    //         .filter(b => b.status === 'CONFIRMED')
    //         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    //         .slice(0, 3);

    //     for (const booking of sortedBookings) {
    //         const session = await this.sessionRepository.findById(booking.sessionId);
    //         if (session) {
    //             activities.push({
    //                 type: 'session_booked',
    //                 title: `Booked ${session.title}`,
    //                 timestamp: booking.createdAt,
    //             });
    //         }
    //     }

    //     // Sort all activities by timestamp and return the most recent 10
    //     return activities
    //         .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    //         .slice(0, 10);
    // }

    private calculateAchievements(
        profile: any,
        lessonsCompleted: number,
        postsCount: number
    ): Achievement[] {
        const achievements: Achievement[] = [];

        // First lesson achievement
        if (lessonsCompleted >= 1) {
            achievements.push({
                id: 'first-lesson',
                badge: '🌸',
                title: 'First Lesson',
                earnedAt: new Date(), // In real app, track when achievement was earned
            });
        }

        // Streak achievement (simplified - in real app, track actual streaks)
        if (lessonsCompleted >= 7) {
            achievements.push({
                id: '7-day-streak',
                badge: '🔥',
                title: '7-Day Streak',
                earnedAt: new Date(),
            });
        }

        // Community active achievement
        if (postsCount >= 3) {
            achievements.push({
                id: 'community-active',
                badge: '💬',
                title: 'Community Active',
                earnedAt: new Date(),
            });
        }

        // Points milestone achievements
        if (profile && profile.points >= 100) {
            achievements.push({
                id: 'points-100',
                badge: '⭐',
                title: '100 Points',
                earnedAt: new Date(),
            });
        }

        if (profile && profile.points >= 500) {
            achievements.push({
                id: 'points-500',
                badge: '🏆',
                title: '500 Points',
                earnedAt: new Date(),
            });
        }

        // Level achievements
        if (profile && profile.level >= 5) {
            achievements.push({
                id: 'level-5',
                badge: '🎯',
                title: 'Level 5',
                earnedAt: new Date(),
            });
        }

        return achievements.slice(0, 5); // Return top 5 achievements
    }
}