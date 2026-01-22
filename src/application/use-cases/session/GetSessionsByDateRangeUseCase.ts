import { SessionRepository } from "../../../infrastructure/database/repositories/SessionRepository";

export interface GetSessionsByDateRangeRequest {
    startDate: string;
    endDate: string;
}

export class GetSessionsByDateRangeUseCase {
    constructor(private sessionRepository: SessionRepository) { }

    async execute(request: GetSessionsByDateRangeRequest): Promise<any[]> {
        const { startDate, endDate } = request;

        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required');
        }

        return await this.sessionRepository.findByDateRange(
            new Date(startDate),
            new Date(endDate)
        );
    }
}