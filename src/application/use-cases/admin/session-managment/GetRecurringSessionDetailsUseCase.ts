import { SessionRepository } from "../../../../infrastructure/database/repositories/SessionRepository";

export class GetRecurringSessionDetailsUseCase {
    constructor(
        private readonly sessionRepository: SessionRepository
    ) { }

    async execute(sessionId: string) {
        const session = await this.sessionRepository.findById(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        const seriesInfo = await this.sessionRepository.getRecurringSeriesInfo(sessionId);

        if (!seriesInfo.isRecurring) {
            return {
                session,
                isRecurring: false,
                recurringDetails: null
            };
        }

        let recurringDetails;

        if (seriesInfo.isParent) {
            const allRecurringSessions = await this.sessionRepository.findByRecurringParentId(session.id);

            recurringDetails = {
                parentSession: session,
                allSessions: [session, ...allRecurringSessions],
                totalSessions: seriesInfo.totalInSeries,
                childrenCount: seriesInfo.childrenCount,
                currentSessionIndex: 0,
                canPromoteChild: seriesInfo.childrenCount > 0,
                nextInLine: allRecurringSessions.length > 0 ? allRecurringSessions[0] : null
            };
        } else {
            const parentSession = await this.sessionRepository.findById(seriesInfo.parentId!);
            const allRecurringSessions = await this.sessionRepository.findByRecurringParentId(seriesInfo.parentId!);

            recurringDetails = {
                parentSession,
                allSessions: [parentSession, ...allRecurringSessions].filter(Boolean),
                totalSessions: seriesInfo.totalInSeries,
                childrenCount: seriesInfo.childrenCount,
                currentSessionIndex: allRecurringSessions.findIndex(s => s.id === session.id) + 1,
                canPromoteChild: false,
                nextInLine: null
            };
        }

        return {
            session,
            isRecurring: true,
            recurringDetails,
            seriesInfo
        };
    }
}