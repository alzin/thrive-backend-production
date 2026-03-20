import { TrialAlternativeTimeRequest } from '../entities/TrialAlternativeTimeRequest';

export interface ITrialAlternativeTimeRequestRepository {
  create(request: TrialAlternativeTimeRequest): Promise<TrialAlternativeTimeRequest>;
  findLatestByUserId(userId: string): Promise<TrialAlternativeTimeRequest | null>;
}
