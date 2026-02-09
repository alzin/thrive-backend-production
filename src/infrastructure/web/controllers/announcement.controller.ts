// backend/src/infrastructure/web/controllers/announcement.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateAnnouncementUseCase } from '../../../application/use-cases/announcement/CreateAnnouncementUseCase';
import { ToggleAnnouncementLikeUseCase } from '../../../application/use-cases/announcement/ToggleAnnouncementLikeUseCase';
import { GetAnnouncementsUseCase } from '../../../application/use-cases/announcement/GetAnnouncementsUseCase';
import { GetAnnouncementByIdUseCase } from '../../../application/use-cases/announcement/GetAnnouncementByIdUseCase';
import { DeleteAnnouncementUseCase } from '../../../application/use-cases/announcement/DeleteAnnouncementUseCase';
import { UpdateAnnouncementUseCase } from '../../../application/use-cases/announcement/UpdateAnnouncementUseCase';
import { CreateCommentUseCase } from '../../../application/use-cases/community/CreateCommentUseCase';
import { GetCommentsUseCase } from '../../../application/use-cases/community/GetCommentsUseCase';
import { UpdateAnnouncementCommentUseCase } from '../../../application/use-cases/announcement/UpdateAnnouncementCommentUseCase';
import { GetAnnouncementCommentCountUseCase } from '../../../application/use-cases/announcement/GetAnnouncementCommentCountUseCase';
import { DeleteAnnouncementCommentUseCase } from '../../../application/use-cases/announcement/DeleteAnnouncementCommentUseCase';


export class AnnouncementController {
  constructor(
    private createAnnouncementUseCase: CreateAnnouncementUseCase,
    private toggleAnnouncementLikeUseCase: ToggleAnnouncementLikeUseCase,
    private getAnnouncementsUseCase: GetAnnouncementsUseCase,
    private getAnnouncementByIdUseCase: GetAnnouncementByIdUseCase,
    private deleteAnnouncementUseCase: DeleteAnnouncementUseCase,
    private updateAnnouncementUseCase: UpdateAnnouncementUseCase,
    private createCommentUseCase: CreateCommentUseCase,
    private getCommentsUseCase: GetCommentsUseCase,
    private updateAnnouncementCommentUseCase: UpdateAnnouncementCommentUseCase,
    private getAnnouncementCommentCountUseCase: GetAnnouncementCommentCountUseCase,
    private deleteAnnouncementCommentUseCase: DeleteAnnouncementCommentUseCase
  ) { }

  async createAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;

      const announcement = await this.createAnnouncementUseCase.execute({
        userId: req.user!.userId,
        content
      });

      res.status(201).json(announcement);
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await this.getAnnouncementsUseCase.execute({
        page: Number(page),
        limit: Number(limit),
        userId: req.user!.userId
      });

      res.json({
        announcements: result.announcements,
        total: result.total,
        page: Number(page),
        totalPages: result.totalPages
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncementById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { announcementId } = req.params;

      const announcement = await this.getAnnouncementByIdUseCase.execute({
        announcementId,
        userId: req.user!.userId
      });

      res.json(announcement);
    } catch (error) {
      if (error instanceof Error && error.message === 'Announcement not found') {
        res.status(404).json({ error: 'Announcement not found' });
        return;
      }
      next(error);
    }
  }

  async toggleLike(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { announcementId } = req.params;

      const result = await this.toggleAnnouncementLikeUseCase.execute({
        userId: req.user!.userId,
        announcementId
      });

      res.json({
        message: result.isLiked ? 'Announcement liked' : 'Announcement unliked',
        isLiked: result.isLiked,
        likesCount: result.likesCount
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { announcementId } = req.params;

      const result = await this.deleteAnnouncementUseCase.execute({
        announcementId,
        userId: req.user!.userId,
        userRole: req.user?.role
      });

      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Announcement not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'Not authorized to delete this announcement') {
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message === 'Failed to delete announcement') {
          res.status(500).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  async editAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { content } = req.body;

      const result = await this.updateAnnouncementUseCase.execute({
        announcementId,
        content,
        userId: req.user!.userId,
        userRole: req.user?.role
      });

      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Announcement not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'Not authorized to edit this announcement') {
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message === 'Failed to edit announcement') {
          res.status(500).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { announcementId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user?.userId;

      console.log('Creating comment for announcement:', { announcementId, userId, content, parentCommentId });

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const comment = await this.createCommentUseCase.execute({
        userId,
        postId: announcementId,
        content: content.trim(),
        parentCommentId
      });

      console.log('Comment created for announcement:', comment);

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Error in createComment for announcement:', error);
      next(error);
    }
  }

  async getCommentsByAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { announcementId } = req.params;
      const { page = 1, limit = 20, includeReplies = true } = req.query;

      console.log('Getting comments for announcement:', announcementId, { page, limit, includeReplies });

      const result = await this.getCommentsUseCase.execute({
        postId: announcementId,
        currentUserId: req.user?.userId,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      const commentCountResult = await this.getAnnouncementCommentCountUseCase.execute({
        announcementId
      });

      console.log('Comments result:', result);

      res.status(200).json({
        success: true,
        data: {
          comments: result.comments,
          pagination: {
            total: result.total,
            totalWithReplies: commentCountResult.count,
            page: result.page,
            limit: Number(limit),
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error in getCommentsByAnnouncement:', error);
      next(error);
    }
  }

  async getCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { announcementId } = req.params;

      const result = await this.getAnnouncementCommentCountUseCase.execute({
        announcementId
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getCommentCount for announcement:', error);
      next(error);
    }
  }

  async updateComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const result = await this.updateAnnouncementCommentUseCase.execute({
        commentId,
        content,
        userId
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Comment content is required') {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
        if (error.message === 'Comment not found') {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        if (error.message === 'You can only edit your own comments') {
          return res.status(403).json({
            success: false,
            message: error.message
          });
        }
        if (error.message === 'Failed to update comment' || error.message === 'User data not found') {
          return res.status(500).json({
            success: false,
            message: error.message
          });
        }
      }
      console.error('Error in updateComment for announcement:', error);
      next(error);
    }
  }

  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const result = await this.deleteAnnouncementCommentUseCase.execute({
        commentId,
        userId
      });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        if (error.message === 'You can only delete your own comments') {
          return res.status(403).json({
            success: false,
            message: error.message
          });
        }
        if (error.message === 'Failed to delete comment') {
          return res.status(500).json({
            success: false,
            message: error.message
          });
        }
      }
      console.error('Error in deleteComment for announcement:', error);
      next(error);
    }
  }
}