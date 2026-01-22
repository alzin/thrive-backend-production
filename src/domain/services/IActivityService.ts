import { RecentActivity, ActivityType } from '../../domain/entities/RecentActivity';

export interface IActivityService {
    logActivity(
        userId: string,
        type: ActivityType,
        title: string,
        description?: string,
        metadata?: Record<string, any>
    ): Promise<RecentActivity>;

    logUserRegistered(userId: string, email: string): Promise<RecentActivity>;
    logLessonCompleted(userId: string, lessonTitle: string, points: number): Promise<RecentActivity>;
    logPostCreated(userId: string, postId: string): Promise<RecentActivity>;
    logSessionBooked(userId: string, sessionTitle: string, sessionDate: Date): Promise<RecentActivity>;
    logSessionAttended(userId: string, sessionTitle: string): Promise<RecentActivity>;
    logCourseCompleted(userId: string, courseTitle: string): Promise<RecentActivity>;
    logAchievementEarned(userId: string, achievementTitle: string, achievementId: string): Promise<RecentActivity>;
    logPointsEarned(userId: string, points: number, reason: string): Promise<RecentActivity>;
    logLevelUp(userId: string, newLevel: number): Promise<RecentActivity>;
    logProfileUpdated(userId: string, updatedFields: string[]): Promise<RecentActivity>;
}