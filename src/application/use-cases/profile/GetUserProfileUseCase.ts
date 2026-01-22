import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";

export interface GetUserProfileRequest {
    userId: string;
}

export interface GetUserProfileResponse {
    id: string;
    name: string;
    bio: string | undefined;
    profilePhoto: string | undefined;
    languageLevel: string | undefined;
    level: number;
    badges: any[];
}

export class GetUserProfileUseCase {
    constructor(private profileRepository: ProfileRepository) { }

    async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
        const { userId } = request;

        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('User profile not found');
        }

        // Return public profile data only
        return {
            id: profile.id,
            name: profile.name,
            bio: profile.bio,
            profilePhoto: profile.profilePhoto,
            languageLevel: profile.languageLevel,
            level: profile.level,
            badges: profile.badges,
            // Don't expose points and other sensitive data
        };
    }
}
