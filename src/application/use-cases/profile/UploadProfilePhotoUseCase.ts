// backend/src/application/use-cases/profile/UploadProfilePhotoUseCase.ts
import { ProfileRepository } from '../../../infrastructure/database/repositories/ProfileRepository';
import { S3StorageService } from '../../../infrastructure/services/S3StorageService';

export interface UploadProfilePhotoRequest {
    userId: string;
    file: {
        buffer: Buffer;
        mimetype: string;
        size: number;
    };
}

export interface UploadProfilePhotoResponse {
    profilePhoto: string | undefined;
    profile: any;
}

export class UploadProfilePhotoUseCase {
    constructor(
        private profileRepository: ProfileRepository,
        private storageService: S3StorageService
    ) { }

    async execute(request: UploadProfilePhotoRequest): Promise<UploadProfilePhotoResponse> {
        const { userId, file } = request;

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('File size exceeds 5MB limit');
        }

        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        // Delete old profile photo if exists
        if (profile.profilePhoto) {
            try {
                await this.storageService.deleteOldProfilePhoto(profile.profilePhoto);
            } catch (error) {
                console.warn('Failed to delete old profile photo:', error);
                // Continue with upload even if old photo deletion fails
            }
        }

        // Upload new photo to S3
        const photoUrl = await this.storageService.uploadProfilePhoto(
            userId,
            file.buffer,
            file.mimetype
        );

        // Update profile with new photo URL
        profile.profilePhoto = photoUrl;
        profile.updatedAt = new Date();

        const updatedProfile = await this.profileRepository.update(profile);

        return {
            profilePhoto: updatedProfile.profilePhoto,
            profile: updatedProfile
        };
    }
}