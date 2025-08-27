// backend/src/infrastructure/web/controllers/video.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateOrUpdateVideoUseCase } from '../../../application/use-cases/video/CreateOrUpdateVideoUseCase';
import { DeleteVideoUseCase } from '../../../application/use-cases/video/DeleteVideoUseCase';
import { VideoRepository } from '../../database/repositories/VideoRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { VideoType } from '../../../domain/entities/Video';
import { MarkTourVideoViewedUseCase } from '../../../application/use-cases/video/MarkTourVideoViewedUseCase';
import { GetVideoUseCase } from '../../../application/use-cases/video/GetVideosUseCase';
import { CheckTourVideoStatusUseCase } from '../../../application/use-cases/video/CheckTourVideoStatusUseCase';

export class VideoController {
  private createOrUpdateVideoUseCase: CreateOrUpdateVideoUseCase;
  private getVideoUseCase: GetVideoUseCase;
  private deleteVideoUseCase: DeleteVideoUseCase;
  private markTourVideoViewedUseCase: MarkTourVideoViewedUseCase;
  private checkTourVideoStatusUseCase: CheckTourVideoStatusUseCase;

  constructor() {
    const videoRepository = new VideoRepository();
    const userRepository = new UserRepository();

    this.createOrUpdateVideoUseCase = new CreateOrUpdateVideoUseCase(videoRepository, userRepository);
    this.getVideoUseCase = new GetVideoUseCase(videoRepository);
    this.deleteVideoUseCase = new DeleteVideoUseCase(videoRepository, userRepository);
    this.markTourVideoViewedUseCase = new MarkTourVideoViewedUseCase(userRepository);
    this.checkTourVideoStatusUseCase = new CheckTourVideoStatusUseCase(userRepository);
  }

  // Admin: Create or Update the single tour video
  async createOrUpdateVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, videoUrl, videoType, thumbnailUrl, duration, isActive } = req.body;

      const video = await this.createOrUpdateVideoUseCase.execute({
        userId: req.user!.userId,
        // title,
        description,
        videoUrl,
        videoType: videoType as VideoType,
        thumbnailUrl,
        // duration: duration ? parseInt(duration) : undefined,
        isActive
      });

      res.status(200).json({
        success: true,
        message: 'Video saved successfully',
        data: video
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get the current video
  async getVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const video = await this.getVideoUseCase.execute();

      res.json({
        success: true,
        data: video
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Delete the video
  async deleteVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const success = await this.deleteVideoUseCase.execute({
        userId: req.user!.userId
      });

      if (success) {
        res.json({
          success: true,
          message: 'Video deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to delete video'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // 🎯 FIRST-TIME LOGIN: Get active tour video for students
  async getTourVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const video = await this.getVideoUseCase.execute();

      // Only return active videos
      if (video && !video.isActive) {
        res.json({
          success: true,
          data: null
        });
        return;
      }

      res.json({
        success: true,
        data: video
      });
    } catch (error) {
      next(error);
    }
  }

  // 🎯 FIRST-TIME LOGIN: Check if user should see auto-tour
  async getTourVideoStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await this.checkTourVideoStatusUseCase.execute({
        userId: req.user!.userId
      });

      res.json({
        success: true,
        data: status // { hasSeenTour: boolean, shouldShowTour: boolean }
      });
    } catch (error) {
      next(error);
    }
  }

  // 🎯 FIRST-TIME LOGIN: Mark tour as viewed (stops future auto-shows)
  async markTourVideoViewed(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.markTourVideoViewedUseCase.execute({
        userId: req.user!.userId
      });

      res.json({
        success: true,
        message: 'Tour video marked as viewed - will not auto-show again'
      });
    } catch (error) {
      next(error);
    }
  }

  // Check if any video exists
  async videoExists(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const exists = await this.getVideoUseCase.exists();

      res.json({
        success: true,
        data: { exists }
      });
    } catch (error) {
      next(error);
    }
  }
}