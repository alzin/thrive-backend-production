// backend/src/application/use-cases/session/GetUpcomingSessionsUseCase.ts
import { SessionRepository } from '../../../infrastructure/database/repositories/SessionRepository';
import { UserRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { ProfileRepository } from '../../../infrastructure/database/repositories/ProfileRepository';

export interface GetUpcomingSessionsRequest {
    limit?: number;
}

export class GetUpcomingSessionsUseCase {
    constructor(
        private sessionRepository: SessionRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(request: GetUpcomingSessionsRequest): Promise<any[]> {
        const { limit = 10 } = request;

        const sessions = await this.sessionRepository.findUpcoming(limit);

        // Enhance sessions with host information
        const enhancedSessions = await Promise.all(
            sessions.map(async (session) => {
                const host = await this.userRepository.findById(session.hostId);
                const hostProfile = await this.profileRepository.findByUserId(session.hostId);

                return {
                    ...session,
                    hostName: hostProfile?.name || host?.email || 'Unknown Host',
                    hostEmail: host?.email,
                };
            })
        );

        return enhancedSessions;
    }
}