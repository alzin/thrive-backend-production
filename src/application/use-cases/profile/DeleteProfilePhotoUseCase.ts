import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";
import { S3StorageService } from "../../../infrastructure/services/S3StorageService";

// backend/src/application/use-cases/profile/DeleteProfilePhotoUseCase.ts
export interface DeleteProfilePhotoRequest {
    userId: string;
}

export class DeleteProfilePhotoUseCase {
    constructor(
        private profileRepository: ProfileRepository,
        private storageService: S3StorageService
    ) { }

    async execute(request: DeleteProfilePhotoRequest): Promise<any> {
        const { userId } = request;

        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        if (!profile.profilePhoto) {
            throw new Error('No profile photo to delete');
        }

        // Delete photo from S3
        try {
            await this.storageService.deleteOldProfilePhoto(profile.profilePhoto);
        } catch (error) {
            console.warn('Failed to delete profile photo from S3:', error);
            // Continue with database update even if S3 deletion fails
        }

        // Remove photo URL from profile
        profile.profilePhoto = '';
        profile.updatedAt = new Date();

        const updatedProfile = await this.profileRepository.update(profile);
        return updatedProfile;
    }
}
