// backend/src/infrastructure/web/controllers/profile.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { S3StorageService } from '../../services/S3StorageService';

export class ProfileController {
  private storageService: S3StorageService;
  private profileRepository: ProfileRepository;

  constructor() {
    this.storageService = new S3StorageService();
    this.profileRepository = new ProfileRepository();
  }

  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.profileRepository.findByUserId(req.user!.userId);
      
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, bio, languageLevel } = req.body;
      
      const profile = await this.profileRepository.findByUserId(req.user!.userId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Validate name
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          res.status(400).json({ error: 'Name must be a non-empty string' });
          return;
        }
        profile.name = name.trim();
      }

      // Validate bio
      if (bio !== undefined) {
        if (typeof bio !== 'string' || bio.length > 500) {
          res.status(400).json({ error: 'Bio must be a string with max 500 characters' });
          return;
        }
        profile.bio = bio.trim();
      }

      // Validate language level
      if (languageLevel !== undefined) {
        const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
        if (!validLevels.includes(languageLevel)) {
          res.status(400).json({ error: 'Invalid language level' });
          return;
        }
        profile.languageLevel = languageLevel;
      }

      profile.updatedAt = new Date();

      const updatedProfile = await this.profileRepository.update(profile);
      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  }

  async uploadProfilePhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' });
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        res.status(400).json({ error: 'File size exceeds 5MB limit' });
        return;
      }

      const profile = await this.profileRepository.findByUserId(req.user!.userId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
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
        req.user!.userId,
        req.file.buffer,
        req.file.mimetype
      );

      // Update profile with new photo URL
      profile.profilePhoto = photoUrl;
      profile.updatedAt = new Date();

      const updatedProfile = await this.profileRepository.update(profile);
      
      res.json({ 
        message: 'Profile photo uploaded successfully',
        profilePhoto: updatedProfile.profilePhoto,
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Profile photo upload error:', error);
      next(error);
    }
  }

  async deleteProfilePhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.profileRepository.findByUserId(req.user!.userId);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      if (!profile.profilePhoto) {
        res.status(400).json({ error: 'No profile photo to delete' });
        return;
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
      
      res.json({ 
        message: 'Profile photo deleted successfully',
        profile: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      
      const profile = await this.profileRepository.findByUserId(userId);
      if (!profile) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      // Return public profile data only
      const publicProfile = {
        id: profile.id,
        name: profile.name,
        bio: profile.bio,
        profilePhoto: profile.profilePhoto,
        languageLevel: profile.languageLevel,
        level: profile.level,
        badges: profile.badges,
        // Don't expose points and other sensitive data
      };

      res.json(publicProfile);
    } catch (error) {
      next(error);
    }
  }
}