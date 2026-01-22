import { IActivityService } from '../../domain/services/IActivityService';
import { RecentActivity, ActivityType } from '../../domain/entities/RecentActivity';
import { RecentActivityRepository } from '../database/repositories/RecentActivityRepository';

export class ActivityService implements IActivityService {
    private activityRepository: RecentActivityRepository;

    constructor() {
        this.activityRepository = new RecentActivityRepository();
    }

    async logActivity(
        userId: string,
        type: ActivityType,
        title: string,
        description?: string,
        metadata?: Record<string, any>
    ): Promise<RecentActivity> {
        const activity = new RecentActivity(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            userId,
            type,
            title,
            description,
            metadata,
            new Date()
        );

        return await this.activityRepository.create(activity);
    }

    async logUserRegistered(userId: string, email: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.USER_REGISTERED,
            'Welcome to Thrive in Japan!',
            'Started Japanese learning journey',
            { email }
        );
    }

    async logLessonCompleted(userId: string, lessonTitle: string, points: number): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.LESSON_COMPLETED,
            `Completed "${lessonTitle}"`,
            points > 0 ? `Earned ${points} points` : undefined,
            { lessonTitle, points }
        );
    }

    async logPostCreated(userId: string, postId: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.POST_CREATED,
            'Posted in Community',
            undefined,
            { postId }
        );
    }

    async logSessionBooked(userId: string, sessionTitle: string, sessionDate: Date): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.SESSION_BOOKED,
            `Booked "${sessionTitle}"`,
            `Scheduled for ${sessionDate.toLocaleDateString()}`,
            { sessionTitle, sessionDate: sessionDate.toISOString() }
        );
    }

    async logSessionAttended(userId: string, sessionTitle: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.SESSION_ATTENDED,
            `Attended "${sessionTitle}"`,
            'Completed speaking practice',
            { sessionTitle }
        );
    }

    async logCourseCompleted(userId: string, courseTitle: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.COURSE_COMPLETED,
            `Completed "${courseTitle}"`,
            'Course mastery achieved!',
            { courseTitle }
        );
    }

    async logAchievementEarned(userId: string, achievementTitle: string, achievementId: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.ACHIEVEMENT_EARNED,
            `Earned "${achievementTitle}"`,
            'New achievement unlocked!',
            { achievementTitle, achievementId }
        );
    }

    async logPointsEarned(userId: string, points: number, reason: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.POINTS_EARNED,
            `Earned ${points} points`,
            reason,
            { points, reason }
        );
    }

    async logLevelUp(userId: string, newLevel: number): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.LEVEL_UP,
            `Reached Level ${newLevel}`,
            'Congratulations on leveling up!',
            { newLevel }
        );
    }

    async logProfileUpdated(userId: string, updatedFields: string[]): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.PROFILE_UPDATED,
            'Profile Updated',
            `Updated: ${updatedFields.join(', ')}`,
            { updatedFields }
        );
    }
}