// backend/src/infrastructure/web/controllers/announcement.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateAnnouncementUseCase } from '../../../application/use-cases/announcement/CreateAnnouncementUseCase';
import { ToggleAnnouncementLikeUseCase } from '../../../application/use-cases/announcement/ToggleAnnouncementLikeUseCase';
import { AnnouncementRepository } from '../../database/repositories/AnnouncementRepository';
import { AnnouncementLikeRepository } from '../../database/repositories/AnnouncementLikeRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { CommentRepository } from "../../database/repositories/CommentRepository";
import { GetCommentsUseCase } from "../../../application/use-cases/community/GetCommentsUseCase";
import { CreateCommentUseCase } from "../../../application/use-cases/community/CreateCommentUseCase";
import { ActivityService } from '../../services/ActivityService';

export class AnnouncementController {
  async createAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;

      const createAnnouncementUseCase = new CreateAnnouncementUseCase(
        new AnnouncementRepository(),
        new UserRepository(),
        new ProfileRepository(),
        new ActivityService()
      );

      const announcement = await createAnnouncementUseCase.execute({
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
      const announcementRepository = new AnnouncementRepository();

      const offset = (Number(page) - 1) * Number(limit);
      const result = await announcementRepository.findAll(Number(limit), offset, req.user!.userId);

      res.json({
        announcements: result.announcements,
        total: result.total,
        page: Number(page),
        totalPages: Math.ceil(result.total / Number(limit))
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncementById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { announcementId } = req.params;
      const announcementRepository = new AnnouncementRepository();

      const announcement = await announcementRepository.findById(announcementId, req.user!.userId);

      if (!announcement) {
        res.status(404).json({ error: 'Announcement not found' });
        return;
      }

      res.json(announcement);
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { announcementId } = req.params;

      const toggleLikeUseCase = new ToggleAnnouncementLikeUseCase(
        new AnnouncementRepository(),
        new AnnouncementLikeRepository()
      );

      const result = await toggleLikeUseCase.execute({
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

      const announcementRepository = new AnnouncementRepository();
      const announcement = await announcementRepository.findById(announcementId);

      if (!announcement) {
        res.status(404).json({ error: "Announcement not found" });
        return;
      }

      if (announcement.author?.userId !== req.user?.userId && req.user?.role !== "ADMIN") {
        res.status(403).json({ error: "Not authorized to delete this announcement" });
        return;
      }

      const deleted = await announcementRepository.delete(announcementId);
      if (!deleted) {
        res.status(500).json({ error: 'Failed to delete announcement' });
        return;
      }

      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async editAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { content } = req.body;

      const announcementRepository = new AnnouncementRepository();
      const announcement = await announcementRepository.findById(announcementId);

      if (!announcement) {
        res.status(404).json({ error: "Announcement not found" });
        return;
      }

      if (announcement.author.userId !== req.user?.userId && req.user?.role !== "ADMIN") {
        res.status(403).json({ error: "Not authorized to edit this announcement" });
        return;
      }

      announcement.content = content;
      announcement.updatedAt = new Date();

      const updatedAnnouncement = await announcementRepository.update(announcement);

      if (!updatedAnnouncement) {
        res.status(500).json({ error: "Failed to edit announcement" });
        return;
      }

      res.json({ message: "Announcement edited successfully", announcement: updatedAnnouncement });

    } catch (error) {
      return next(error);
    }
  }

  // Comments Operations for Announcements
  async getCommentsByAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { announcementId } = req.params;
      const { page = 1, limit = 20, includeReplies = true } = req.query;

      console.log('Getting comments for announcement:', announcementId, { page, limit, includeReplies });

      const getCommentsUseCase = new GetCommentsUseCase(
        new CommentRepository(),
        new UserRepository(),
        new ProfileRepository()
      );

      // Use announcementId as postId since comments use postId field
      const result = await getCommentsUseCase.execute({
        postId: announcementId,
        currentUserId: req.user?.userId,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      // Get the total count of ALL comments (including replies) for accurate count
      const commentRepository = new CommentRepository();
      const totalCommentsIncludingReplies = await commentRepository.countByPost(announcementId);

      console.log('Comments result:', result);

      res.status(200).json({
        success: true,
        data: {
          comments: result.comments,
          pagination: {
            total: result.total, // This is just top-level comments for pagination
            totalWithReplies: totalCommentsIncludingReplies, // Total including all replies
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
        new AnnouncementRepository(), // This now works because AnnouncementRepository implements ICommentableRepository
        new UserRepository(),
        new ProfileRepository()
      );

      // Use announcementId as postId since comments use postId field
      const comment = await createCommentUseCase.execute({
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

  async getCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { announcementId } = req.params;

      const commentRepository = new CommentRepository();

      // Get total count including all replies (using announcementId as postId)
      const totalCount = await commentRepository.countByPost(announcementId);

      // Optionally also get top-level count
      const topLevelCount = await commentRepository.countTopLevelByPost(announcementId);

      res.status(200).json({
        success: true,
        data: {
          count: totalCount, // Total including replies
          topLevelCount, // Just top-level comments
          repliesCount: totalCount - topLevelCount // Number of replies
        }
      });
    } catch (error) {
      console.error('Error in getCommentCount for announcement:', error);
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

      const commentRepository = new CommentRepository();
      const announcementRepository = new AnnouncementRepository();

      const existingComment = await commentRepository.findById(commentId);
      if (!existingComment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found"
        });
      }

      // Check if user owns the comment
      if (existingComment.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own comments"
        });
      }

      const deleted = await commentRepository.delete(commentId);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete comment"
        });
      }

      // After successful deletion, re-calculate the total comment count
      const newTotalCommentCount = await commentRepository.countByPost(existingComment.postId);

      // Update the commentsCount on the parent announcement directly
      const announcement = await announcementRepository.findById(existingComment.postId);
      if (announcement) {
        announcement.commentsCount = newTotalCommentCount;
        await announcementRepository.update(announcement);
      }

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
        newCommentsCount: newTotalCommentCount // Return the new count
      });
    } catch (error) {
      console.error('Error in deleteComment for announcement:', error);
      next(error);
    }
  }

  // New method to update a comment on an announcement
  async updateComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      const commentRepository = new CommentRepository();
      const existingComment = await commentRepository.findById(commentId);
      
      if (!existingComment) {
        return res.status(404).json({ success: false, message: "Comment not found" });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({ success: false, message: "You can only edit your own comments" });
      }

      existingComment.content = content.trim();
      existingComment.updatedAt = new Date();

      const updatedComment = await commentRepository.update(existingComment);

      res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: updatedComment,
      });
      
    } catch (error) {
      console.error('Error in updateComment for announcement:', error);
      next(error);
    }
  }
}