// backend/src/application/use-cases/profile/GetMyProfileUseCase.ts
import { ProfileRepository } from '../../../infrastructure/database/repositories/ProfileRepository';

export interface GetMyProfileRequest {
    userId: string;
}

export class GetMyProfileUseCase {
    constructor(private profileRepository: ProfileRepository) { }

    async execute(request: GetMyProfileRequest): Promise<any> {
        const { userId } = request;

        const profile = await this.profileRepository.findByUserId(userId);

        if (!profile) {
            throw new Error('Profile not found');
        }

        return profile;
    }
}