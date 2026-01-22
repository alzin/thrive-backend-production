import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { SessionRepository } from "../../../infrastructure/database/repositories/SessionRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";

// backend/src/application/use-cases/session/GetSessionByIdUseCase.ts
export interface GetSessionByIdRequest {
    sessionId: string;
}

export class GetSessionByIdUseCase {
    constructor(
        private sessionRepository: SessionRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(request: GetSessionByIdRequest): Promise<any> {
        const { sessionId } = request;

        const session = await this.sessionRepository.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Enhance with host information
        const host = await this.userRepository.findById(session.hostId);
        const hostProfile = await this.profileRepository.findByUserId(session.hostId);

        return {
            ...session,
            hostName: hostProfile?.name || host?.email || 'Unknown Host',
            hostEmail: host?.email,
        };
    }
}