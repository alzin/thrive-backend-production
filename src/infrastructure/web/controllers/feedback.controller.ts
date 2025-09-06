// backend/src/infrastructure/web/controllers/feedback.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateFeedbackUseCase } from '../../../application/use-cases/feedback/CreateFeedbackUseCase';
import { ToggleFeedbackLikeUseCase } from '../../../application/use-cases/feedback/ToggleFeedbackLikeUseCase';
import { GetFeedbackListUseCase } from '../../../application/use-cases/feedback/GetFeedbackListUseCase';
import { GetCommentsUseCase } from "../../../application/use-cases/community/GetCommentsUseCase";
import { CreateCommentUseCase } from "../../../application/use-cases/community/CreateCommentUseCase";
import { FeedbackRepository } from '../../database/repositories/FeedbackRepository';
import { FeedbackLikeRepository } from '../../database/repositories/FeedbackLikeRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { CommentRepository } from "../../database/repositories/CommentRepository";
import { ActivityService } from '../../services/ActivityService';
import { S3StorageService } from '../../services/S3StorageService';

export class FeedbackController {
  private storageService: S3StorageService;

  constructor() {
    this.storageService = new S3StorageService();
  }

  async uploadMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.log('No files uploaded - req.files:', req.files);
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const userId = req.user!.userId;

      // Validate all files before processing
      for (const file of files) {
        try {
          S3StorageService.validateCommunityMediaFile(file);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

      // Upload files to S3
      const uploadedFiles = await this.storageService.uploadMultipleCommunityMedia(
        userId,
        files.map(file => ({
          buffer: file.buffer,
          filename: file.originalname,
          mimeType: file.mimetype,
        }))
      );

      console.log('Files uploaded successfully:', uploadedFiles.length);

      res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles.map(file => ({
          url: file.url,
          size: file.size,
          mimeType: file.mimeType,
        })),
      });
    } catch (error) {
      console.error('Media upload error:', error);
      next(error);
    }
  }

  async deleteMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mediaUrls } = req.body;

      if (!mediaUrls || !Array.isArray(mediaUrls)) {
        res.status(400).json({ error: 'Invalid media URLs' });
        return;
      }

      // Delete files from S3
      await this.storageService.deleteMultipleCommunityMedia(mediaUrls);

      res.json({ message: 'Media files deleted successfully' });
    } catch (error) {
      console.error('Media deletion error:', error);
      next(error);
    }
  }

  async createFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, mediaUrls } = req.body;

      const createFeedbackUseCase = new CreateFeedbackUseCase(
        new FeedbackRepository(),
        new UserRepository(),
        new ProfileRepository(),
        // new ActivityService()
      );

      const feedback = await createFeedbackUseCase.execute({
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

      const getFeedbackListUseCase = new GetFeedbackListUseCase(
        new FeedbackRepository()
      );

      const result = await getFeedbackListUseCase.execute({
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
      const feedbackRepository = new FeedbackRepository();

      const feedback = await feedbackRepository.findById(feedbackId, req.user?.userId);

      if (!feedback) {
        res.status(404).json({
          success: false,
          message: "Feedback not found"
        });
        return;
      }

      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Error in getFeedbackById:', error);
      next(error);
    }
  }

  async toggleLike(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feedbackId } = req.params;

      const toggleFeedbackLikeUseCase = new ToggleFeedbackLikeUseCase(
        new FeedbackRepository(),
        new FeedbackLikeRepository()
      );

      const result = await toggleFeedbackLikeUseCase.execute({
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

      const feedbackRepository = new FeedbackRepository();
      const feedback = await feedbackRepository.findById(feedbackId);

      if (!feedback) {
        res.status(404).json({ 
          success: false, 
          message: "Feedback not found" 
        });
        return;
      }

      if (feedback.author.userId !== req.user?.userId && req.user?.role !== "ADMIN") {
        res.status(403).json({ 
          success: false, 
          message: "Not authorized to edit this feedback" 
        });
        return;
      }

      // Delete removed media files from S3
      if (removedMediaUrls && removedMediaUrls.length > 0) {
        try {
          await this.storageService.deleteMultipleCommunityMedia(removedMediaUrls);
        } catch (error) {
          console.warn('Failed to delete removed media files:', error);
          // Continue with feedback update even if media deletion fails
        }
      }

      feedback.content = content;
      feedback.mediaUrls = mediaUrls || [];
      feedback.updatedAt = new Date();

      const updatedFeedback = await feedbackRepository.update(feedback);

      res.json({ 
        success: true,
        data: updatedFeedback,
        message: "Feedback updated successfully" 
      });

    } catch (error) {
      console.error('Error in updateFeedback:', error);
      next(error);
    }
  }

  async deleteFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feedbackId } = req.params;

      const feedbackRepository = new FeedbackRepository();
      const feedback = await feedbackRepository.findById(feedbackId);

      if (!feedback) {
        res.status(404).json({ 
          success: false, 
          message: "Feedback not found" 
        });
        return;
      }

      if (feedback.author?.userId !== req.user?.userId && req.user?.role !== "ADMIN") {
        res.status(403).json({ 
          success: false, 
          message: "Not authorized to delete this feedback" 
        });
        return;
      }

      // Delete associated media files from S3 before deleting the feedback
      if (feedback.mediaUrls && feedback.mediaUrls.length > 0) {
        try {
          await this.storageService.deleteMultipleCommunityMedia(feedback.mediaUrls);
        } catch (error) {
          console.warn('Failed to delete media files:', error);
          // Continue with feedback deletion even if media deletion fails
        }
      }

      const deleted = await feedbackRepository.delete(feedbackId);
      if (!deleted) {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to delete feedback' 
        });
        return;
      }

      res.json({ 
        success: true, 
        message: 'Feedback deleted successfully' 
      });
    } catch (error) {
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

      const getCommentsUseCase = new GetCommentsUseCase(
        new CommentRepository(),
        new UserRepository(),
        new ProfileRepository()
      );

      const result = await getCommentsUseCase.execute({
        postId: feedbackId, // Using postId field for both posts and feedback
        currentUserId: req.user?.userId,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      // Get the total count of ALL comments (including replies) for accurate count
      const commentRepository = new CommentRepository();
      const totalCommentsIncludingReplies = await commentRepository.countByPost(feedbackId);

      res.status(200).json({
        success: true,
        data: {
          comments: result.comments,
          pagination: {
            total: result.total,
            totalWithReplies: totalCommentsIncludingReplies,
            page: result.page,
            limit: Number(limit),
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1
          }
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

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment content is required"
        });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment content must not exceed 1000 characters"
        });
      }

      const createCommentUseCase = new CreateCommentUseCase(
        new CommentRepository(),
        new FeedbackRepository(), // FeedbackRepository implements ICommentableRepository
        new UserRepository(),
        new ProfileRepository()
      );

      const comment = await createCommentUseCase.execute({
        userId,
        postId: feedbackId, // Using postId field for both posts and feedback
        content: content.trim(),
        parentCommentId
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Error in createComment:', error);
      next(error);
    }
  }

  async getCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { feedbackId } = req.params;

      const commentRepository = new CommentRepository();
      
      // Get total count including all replies
      const totalCount = await commentRepository.countByPost(feedbackId);
      
      // Optionally also get top-level count
      const topLevelCount = await commentRepository.countTopLevelByPost(feedbackId);

      res.status(200).json({
        success: true,
        data: {
          count: totalCount,
          topLevelCount,
          repliesCount: totalCount - topLevelCount
        }
      });
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      next(error);
    }
  }
}