import { SessionRepository } from "../../../../infrastructure/database/repositories/SessionRepository";
import { UserRepository } from "../../../../infrastructure/database/repositories/UserRepository";
import { ProfileRepository } from "../../../../infrastructure/database/repositories/ProfileRepository";

interface GetSessionsInput {
    page?: number;
    limit?: number;
    type?: string;
    isActive?: boolean;
    isRecurring?: boolean;
}

export class GetSessionsWithPaginationUseCase {
    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly userRepository: UserRepository,
        private readonly profileRepository: ProfileRepository
    ) { }

    async execute(input: GetSessionsInput) {
        const page = input.page || 1;
        const limit = input.limit || 10;
        const offset = (page - 1) * limit;

        const filters: any = {};

        if (input.type && (input.type === 'SPEAKING' || input.type === 'EVENT')) {
            filters.type = input.type;
        }

        if (input.isActive !== undefined) {
            filters.isActive = input.isActive;
        }

        if (input.isRecurring !== undefined) {
            filters.isRecurring = input.isRecurring;
        }

        const { sessions, total } = await this.sessionRepository.findAllWithPagination({
            offset,
            limit,
            filters
        });

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
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            }
        };
    }
}
