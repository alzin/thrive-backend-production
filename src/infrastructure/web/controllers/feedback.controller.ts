import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Use Cases
import { UploadMediaUseCase } from '../../../application/use-cases/feedback/UploadMediaUseCase';
import { DeleteMediaUseCase } from '../../../application/use-cases/feedback/DeleteMediaUseCase';
import { CreateFeedbackUseCase } from '../../../application/use-cases/feedback/CreateFeedbackUseCase';
import { GetFeedbackListUseCase } from '../../../application/use-cases/feedback/GetFeedbackListUseCase';
import { GetFeedbackByIdUseCase } from '../../../application/use-cases/feedback/GetFeedbackByIdUseCase';
import { ToggleFeedbackLikeUseCase } from '../../../application/use-cases/feedback/ToggleFeedbackLikeUseCase';
import { UpdateFeedbackUseCase } from '../../../application/use-cases/feedback/UpdateFeedbackUseCase';
import { DeleteFeedbackUseCase } from '../../../application/use-cases/feedback/DeleteFeedbackUseCase';
import { GetCommentsByFeedbackUseCase } from '../../../application/use-cases/feedback/GetCommentsByFeedbackUseCase';
import { CreateCommentOnFeedbackUseCase } from '../../../application/use-cases/feedback/CreateCommentOnFeedbackUseCase';
import { GetCommentCountUseCase } from '../../../application/use-cases/feedback/GetCommentCountUseCase';

export class FeedbackController {
  constructor(
    // Media use cases
    private uploadMediaUseCase: UploadMediaUseCase,
    private deleteMediaUseCase: DeleteMediaUseCase,

    // Feedback use cases
    private createFeedbackUseCase: CreateFeedbackUseCase,
    private getFeedbackListUseCase: GetFeedbackListUseCase,
    private getFeedbackByIdUseCase: GetFeedbackByIdUseCase,
    private toggleFeedbackLikeUseCase: ToggleFeedbackLikeUseCase,
    private updateFeedbackUseCase: UpdateFeedbackUseCase,
    private deleteFeedbackUseCase: DeleteFeedbackUseCase,

    // Comment use cases
    private getCommentsByFeedbackUseCase: GetCommentsByFeedbackUseCase,
    private createCommentOnFeedbackUseCase: CreateCommentOnFeedbackUseCase,
    private getCommentCountUseCase: GetCommentCountUseCase
  ) { }

  async uploadMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.log('No files uploaded - req.files:', req.files);
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const userId = req.user!.userId;

      const result = await this.uploadMediaUseCase.execute({
        userId,
        files: files.map(file => ({
          buffer: file.buffer,
          filename: file.originalname,
          mimeType: file.mimetype,
        }))
      });

      console.log('Files uploaded successfully:', result.files.length);

      res.json({
        message: 'Files uploaded successfully',
        files: result.files,
      });
    } catch (error) {
      console.error('Media upload error:', error);
      next(error);
    }
  }

  async deleteMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mediaUrls } = req.body;

      await this.deleteMediaUseCase.execute({ mediaUrls });
      res.json({ message: 'Media files deleted successfully' });
    } catch (error) {
      console.error('Media deletion error:', error);
      next(error);
    }
  }

  async createFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, mediaUrls } = req.body;

      const feedback = await this.createFeedbackUseCase.execute({
        userId: req.user!.userId,
        content,
        mediaUrls: mediaUrls || [],
      });

      res.status(201).json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Error in createFeedback:', error);
      next(error);
    }
  }

  async getFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await this.getFeedbackListUseCase.execute({
        page: Number(page),
        limit: Number(limit),
        currentUserId: req.user?.userId
      });

      res.json({
        success: true,
        data: {
          feedback: result.feedback,
          pagination: {
            total: result.total,
            page: result.page,
            limit: Number(limit),
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error in getFeedback:', error);
      next(error);
    }
  }

  async getFeedbackById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feedbackId } = req.params;

      const feedback = await this.getFeedbackByIdUseCase.execute({
        feedbackId,
        userId: req.user?.userId
      });

      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Feedback not found") {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      console.error('Error in getFeedbackById:', error);
      next(error);
    }
  }

  async toggleLike(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feedbackId } = req.params;

      const result = await this.toggleFeedbackLikeUseCase.execute({
        userId: req.user!.userId,
        feedbackId
      });

      res.json({
        success: true,
        data: {
          message: result.isLiked ? 'Feedback liked' : 'Feedback unliked',
          isLiked: result.isLiked,
          likesCount: result.likesCount
        }
      });
    } catch (error) {
      console.error('Error in toggleLike:', error);
      next(error);
    }
  }

  async updateFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feedbackId } = req.params;
      const { content, mediaUrls, removedMediaUrls } = req.body;

      const updatedFeedback = await this.updateFeedbackUseCase.execute({
        feedbackId,
        userId: req.user!.userId,
        userRole: req.user!.role,
        content,
        mediaUrls,
        removedMediaUrls
      });

      res.json({
        success: true,
        data: updatedFeedback,
        message: "Feedback updated successfully"
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Feedback not found") {
          res.status(404).json({
            success: false,
            message: error.message
          });
          return;
        }
        if (error.message === "Not authorized to edit this feedback") {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
      }
      console.error('Error in updateFeedback:', error);
      next(error);
    }
  }

  async deleteFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feedbackId } = req.params;

      await this.deleteFeedbackUseCase.execute({
        feedbackId,
        userId: req.user!.userId,
        userRole: req.user!.role
      });

      res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Feedback not found") {
          res.status(404).json({
            success: false,
            message: error.message
          });
          return;
        }
        if (error.message === "Not authorized to delete this feedback") {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
        if (error.message === 'Failed to delete feedback') {
          res.status(500).json({
            success: false,
            message: error.message
          });
          return;
        }
      }
      console.error('Error in deleteFeedback:', error);
      next(error);
    }
  }

  // Comment operations on feedback
  async getCommentsByFeedback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { feedbackId } = req.params;
      const { page = 1, limit = 20, includeReplies = true } = req.query;

      console.log('Getting comments for feedback:', feedbackId, { page, limit, includeReplies });

      const result = await this.getCommentsByFeedbackUseCase.execute({
        feedbackId,
        currentUserId: req.user?.userId,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      res.status(200).json({
        success: true,
        data: {
          comments: result.comments,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error in getCommentsByFeedback:', error);
      next(error);
    }
  }

  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { feedbackId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const comment = await this.createCommentOnFeedbackUseCase.execute({
        feedbackId,
        userId,
        content,
        parentCommentId
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Comment content is required") {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
      }
      console.error('Error in createComment:', error);
      next(error);
    }
  }

  async getCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { feedbackId } = req.params;

      const result = await this.getCommentCountUseCase.execute({ feedbackId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      next(error);
    }
  }
}