import { SessionRepository } from "../../../../infrastructure/database/repositories/SessionRepository";

interface UpdateSessionInput {
    sessionId: string;
    updates: any;
    updateAllRecurring?: boolean;
}

export class UpdateSessionUseCase {
    constructor(
        private readonly sessionRepository: SessionRepository
    ) { }

    async execute(input: UpdateSessionInput) {
        const session = await this.sessionRepository.findById(input.sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        if (session.isRecurring && !session.recurringParentId && input.updateAllRecurring) {
            const allRecurringSessions = await this.sessionRepository.findByRecurringParentId(session.id);

            Object.assign(session, input.updates);
            session.updatedAt = new Date();
            await this.sessionRepository.update(session);

            for (const recurringSession of allRecurringSessions) {
                const recurringUpdates = {
                    title: input.updates.title || recurringSession.title,
                    description: input.updates.description || recurringSession.description,
                    duration: input.updates.duration || recurringSession.duration,
                    maxParticipants: input.updates.maxParticipants || recurringSession.maxParticipants,
                    pointsRequired: input.updates.pointsRequired !== undefined ? input.updates.pointsRequired : recurringSession.pointsRequired,
                    isActive: input.updates.isActive !== undefined ? input.updates.isActive : recurringSession.isActive,
                    meetingUrl: input.updates.meetingUrl || recurringSession.meetingUrl,
                    updatedAt: new Date()
                };

                Object.assign(recurringSession, recurringUpdates);
                await this.sessionRepository.update(recurringSession);
            }

            return {
                message: `Updated ${allRecurringSessions.length + 1} sessions in the recurring series`,
                updatedCount: allRecurringSessions.length + 1
            };
        } else {
            Object.assign(session, input.updates);
            session.updatedAt = new Date();
            return await this.sessionRepository.update(session);
        }
    }
}