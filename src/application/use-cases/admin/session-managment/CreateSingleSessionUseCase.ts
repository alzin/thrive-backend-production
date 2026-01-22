import { SessionRepository } from "../../../../infrastructure/database/repositories/SessionRepository";
import { Session, SessionType } from "../../../../domain/entities/Session";

interface CreateSingleSessionInput {
    title: string;
    description: string;
    type: SessionType;
    hostId: string;
    meetingUrl?: string;
    location?: string;
    scheduledAt: Date;
    duration: number;
    maxParticipants: number;
    pointsRequired?: number;
    isActive?: boolean;
}

export class CreateSingleSessionUseCase {
    constructor(
        private readonly sessionRepository: SessionRepository
    ) { }

    async execute(input: CreateSingleSessionInput) {
        const session = new Session(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            input.title,
            input.description,
            input.type,
            input.hostId,
            input.meetingUrl,
            input.location,
            input.scheduledAt,
            input.duration,
            input.maxParticipants,
            0,
            input.pointsRequired || 0,
            input.isActive !== undefined ? input.isActive : true,
            false,
            undefined,
            undefined,
            new Date(),
            new Date()
        );

        return await this.sessionRepository.create(session);
    }
}