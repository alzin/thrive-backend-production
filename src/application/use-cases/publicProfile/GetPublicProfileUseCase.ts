// backend/src/application/use-cases/publicProfile/GetPublicProfileUseCase.ts
import { ProfileRepository } from '../../../infrastructure/database/repositories/ProfileRepository';
import { UserRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { ProgressRepository } from '../../../infrastructure/database/repositories/ProgressRepository';
import { PostRepository } from '../../../infrastructure/database/repositories/PostRepository';
import { LessonRepository } from '../../../infrastructure/database/repositories/LessonRepository';
import { CourseRepository } from '../../../infrastructure/database/repositories/CourseRepository';
import { EnrollmentRepository } from '../../../infrastructure/database/repositories/EnrollmentRepository';
import { BookingRepository } from '../../../infrastructure/database/repositories/BookingRepository';
import { RecentActivityRepository } from '../../../infrastructure/database/repositories/RecentActivityRepository';
import { Progress } from '../../../domain/entities/Progress';
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
    totalLessonsCompleted: number;
    totalLessonsAvailable: number;
    totalPoints: number;
    joinedDaysAgo: number;
    totalCourses: number;
    enrolledCourses: number;
    completedCourses: number;
    communityPosts: number;
    sessionsAttended: number;
    publicAchievements: Array<{
        id: string;
        title: string;
        icon: string;
        description: string;
        unlockedAt: string;
        rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }>;
    learningStats: Array<{
        skill: string;
        level: number;
        color: string;
    }>;
    recentMilestones: RecentActivity[];
    courseProgress: Array<{
        courseTitle: string;
        totalLessons: number;
        completedLessons: number;
        progressPercentage: number;
    }>;
}

export interface GetPublicProfileRequest {
    userId: string;
}

export class GetPublicProfileUseCase {
    constructor(
        private profileRepository: ProfileRepository,
        private userRepository: UserRepository,
        private progressRepository: ProgressRepository,
        private postRepository: PostRepository,
        private lessonRepository: LessonRepository,
        private courseRepository: CourseRepository,
        private enrollmentRepository: EnrollmentRepository,
        private bookingRepository: BookingRepository,
        private recentActivityRepository: RecentActivityRepository
    ) { }

    async execute(request: GetPublicProfileRequest): Promise<PublicProfileData> {
        const { userId } = request;

        // Get user and profile data
        const user = await this.userRepository.findById(userId);
        if (!user || !user.isActive) {
            throw new Error('Profile not found');
        }

        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('Profile not found');
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
            const courseProgressData = await this.progressRepository.findByUserAndCourse(userId, courseId);
            userProgress.push(...courseProgressData);
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

        return {
            id: profile.id,
            name: profile.name,
            bio: profile.bio || undefined,
            profilePhoto: profile.profilePhoto || undefined,
            languageLevel: profile.languageLevel || undefined,
            level: profile.level,
            badges: profile.badges,
            createdAt: user.createdAt.toISOString(),
            totalLessonsCompleted,
            totalLessonsAvailable,
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
}