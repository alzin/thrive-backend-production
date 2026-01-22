import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";

// backend/src/application/use-cases/profile/UpdateProfileUseCase.ts
export interface UpdateProfileRequest {
    userId: string;
    name?: string;
    bio?: string;
    languageLevel?: string;
}

export class UpdateProfileUseCase {
    constructor(private profileRepository: ProfileRepository) { }

    async execute(request: UpdateProfileRequest): Promise<any> {
        const { userId, name, bio, languageLevel } = request;

        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        // Validate name
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                throw new Error('Name must be a non-empty string');
            }
            profile.name = name.trim();
        }

        // Validate bio
        if (bio !== undefined) {
            if (typeof bio !== 'string' || bio.length > 500) {
                throw new Error('Bio must be a string with max 500 characters');
            }
            profile.bio = bio.trim();
        }

        // Validate language level
        if (languageLevel !== undefined) {
            const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
            if (!validLevels.includes(languageLevel)) {
                throw new Error('Invalid language level');
            }
            profile.languageLevel = languageLevel;
        }

        profile.updatedAt = new Date();

        const updatedProfile = await this.profileRepository.update(profile);
        return updatedProfile;
    }
}