import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";

export interface GetUserProfileRequest {
    userId: string;
}

export class GetUserProfileUseCase {
    constructor(private profileRepository: ProfileRepository) { }

    async execute(request: GetUserProfileRequest): Promise<any> {
        const { userId } = request;

        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('User not found');
        }

        return profile;
    }
}