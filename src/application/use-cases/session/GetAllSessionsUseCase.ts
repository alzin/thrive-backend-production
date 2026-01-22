import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { SessionRepository } from "../../../infrastructure/database/repositories/SessionRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";

// backend/src/application/use-cases/session/GetAllSessionsUseCase.ts
export interface GetAllSessionsRequest {
    page?: number;
    limit?: number;
    type?: string;
    isActive?: boolean;
}

export interface GetAllSessionsResponse {
    sessions: any[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export class GetAllSessionsUseCase {
    constructor(
        private sessionRepository: SessionRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(request: GetAllSessionsRequest): Promise<GetAllSessionsResponse> {
        const { page = 1, limit = 20, type, isActive } = request;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build filter conditions
        const filters: any = {};

        if (type && (type === 'SPEAKING' || type === 'EVENT')) {
            filters.type = type;
        }

        if (isActive !== undefined) {
            filters.isActive = isActive;
        }

        // Get sessions with pagination and filters
        const { sessions, total } = await this.sessionRepository.findAllWithPagination({
            offset,
            limit: limitNum,
            filters
        });

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

        return {
            sessions: enhancedSessions,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            hasNextPage: pageNum * limitNum < total,
            hasPrevPage: pageNum > 1,
        };
    }
}