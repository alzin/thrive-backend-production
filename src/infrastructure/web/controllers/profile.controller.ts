// backend/src/infrastructure/web/controllers/profile.controller.ts - Updated with Dependency Injection
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { GetMyProfileUseCase } from '../../../application/use-cases/profile/GetMyProfileUseCase';
import { UpdateProfileUseCase } from '../../../application/use-cases/profile/UpdateProfileUseCase';
import { UploadProfilePhotoUseCase } from '../../../application/use-cases/profile/UploadProfilePhotoUseCase';
import { DeleteProfilePhotoUseCase } from '../../../application/use-cases/profile/DeleteProfilePhotoUseCase';
import { GetUserProfileUseCase } from '../../../application/use-cases/profile/GetUserProfileUseCase';

export class ProfileController {
  constructor(
    private getMyProfileUseCase: GetMyProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase,
    private uploadProfilePhotoUseCase: UploadProfilePhotoUseCase,
    private deleteProfilePhotoUseCase: DeleteProfilePhotoUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase
  ) { }

  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.getMyProfileUseCase.execute({
        userId: req.user!.userId
      });

      res.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, bio, languageLevel } = req.body;

      const updatedProfile = await this.updateProfileUseCase.execute({
        userId: req.user!.userId,
        name,
        bio,
        languageLevel
      });

      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Profile not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'Name must be a non-empty string' ||
          error.message === 'Bio must be a string with max 500 characters' ||
          error.message === 'Invalid language level') {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  async uploadProfilePhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const result = await this.uploadProfilePhotoUseCase.execute({
        userId: req.user!.userId,
        file: {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });

      res.json({
        message: 'Profile photo uploaded successfully',
        profilePhoto: result.profilePhoto,
        profile: result.profile
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Profile not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' ||
          error.message === 'File size exceeds 5MB limit') {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      console.error('Profile photo upload error:', error);
      next(error);
    }
  }

  async deleteProfilePhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedProfile = await this.deleteProfilePhotoUseCase.execute({
        userId: req.user!.userId
      });

      res.json({
        message: 'Profile photo deleted successfully',
        profile: updatedProfile
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Profile not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'No profile photo to delete') {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  async getUserProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const publicProfile = await this.getUserProfileUseCase.execute({ userId });

      res.json(publicProfile);
    } catch (error) {
      if (error instanceof Error && error.message === 'User profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
}