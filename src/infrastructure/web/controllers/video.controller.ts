// backend/src/infrastructure/web/controllers/video.controller.ts - Updated with Dependency Injection
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { VideoType } from '../../../domain/entities/Video';

// Use Cases
import { CreateOrUpdateVideoUseCase } from '../../../application/use-cases/video/CreateOrUpdateVideoUseCase';
import { GetVideoUseCase } from '../../../application/use-cases/video/GetVideosUseCase';
import { DeleteVideoUseCase } from '../../../application/use-cases/video/DeleteVideoUseCase';
import { CheckTourVideoStatusUseCase } from '../../../application/use-cases/video/CheckTourVideoStatusUseCase';
import { MarkTourVideoViewedUseCase } from '../../../application/use-cases/video/MarkTourVideoViewedUseCase';

export class VideoController {
  constructor(
    private createOrUpdateVideoUseCase: CreateOrUpdateVideoUseCase,
    private getVideoUseCase: GetVideoUseCase,
    private deleteVideoUseCase: DeleteVideoUseCase,
    private checkTourVideoStatusUseCase: CheckTourVideoStatusUseCase,
    private markTourVideoViewedUseCase: MarkTourVideoViewedUseCase,
  ) { }

  async createOrUpdateVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { description, videoUrl, videoType, thumbnailUrl, isActive } = req.body;

      const video = await this.createOrUpdateVideoUseCase.execute({
        userId: req.user!.userId,
        description,
        videoUrl,
        videoType: videoType as VideoType,
        thumbnailUrl,
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