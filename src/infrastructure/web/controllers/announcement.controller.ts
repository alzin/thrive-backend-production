// backend/src/infrastructure/web/controllers/announcement.controller.ts - FIXED
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
  // ... keep all existing methods until updateComment ...

  // Fixed updateComment method for AnnouncementController
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

      const commentRepository = new CommentRepository();
      const userRepository = new UserRepository();
      const profileRepository = new ProfileRepository();

      const existingComment = await commentRepository.findById(commentId);

      if (!existingComment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found"
        });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own comments"
        });
      }

      // Update the comment content
      existingComment.content = content.trim();
      existingComment.updatedAt = new Date();

      const updatedComment = await commentRepository.update(existingComment);

      if (!updatedComment) {
        return res.status(500).json({
          success: false,
          message: "Failed to update comment"
        });
      }

      // Fetch user and profile data to populate author information
      const user = await userRepository.findById(userId);
      const profile = await profileRepository.findByUserId(userId);

      if (!user) {
        return res.status(500).json({
          success: false,
          message: "User data not found"
        });
      }

      // Transform response to include complete author data
      const responseData = {
        id: updatedComment.id,
        postId: updatedComment.postId,
        userId: updatedComment.userId,
        content: updatedComment.content,
        parentCommentId: updatedComment.parentCommentId,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        author: {
          userId: user.id,
          name: profile?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar: profile?.profilePhoto || '',
          level: profile?.level || 1
        }
      };

      console.log('Updated comment with author data:', responseData);

      // FIX: Match the expected structure from Redux thunk
      res.status(200).json({
        success: true,
        data: responseData // ← Keep 'data' to match Redux thunk expectation
      });

    } catch (error) {
      console.error('Error in updateComment for announcement:', error);
      next(error);
    }
  }

  // Helper method to transform comment data with author info (for consistency)
  private async transformCommentWithAuthor(comment: any, userRepository: UserRepository, profileRepository: ProfileRepository) {
    try {
      const user = await userRepository.findById(comment.userId);
      const profile = await profileRepository.findByUserId(comment.userId);

      return {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        parentCommentId: comment.parentCommentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          userId: user?.id || comment.userId,
          name: profile?.name || user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
          avatar: profile?.profilePhoto || '',
          level: profile?.level || 1
        }
      };
    } catch (error) {
      console.error('Error transforming comment with author:', error);
      // Return comment with basic author info as fallback
      return {
        ...comment,
        author: {
          userId: comment.userId,
          name: 'User',
          email: '',
          avatar: '',
          level: 1
        }
      };
    }
  }

  // ALSO FIX: Update createComment to ensure consistent author data
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
        new AnnouncementRepository(),
        new UserRepository(),
        new ProfileRepository()
      );

      // Create comment using the use case (which should handle author population)
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

  // Keep all other existing methods unchanged...
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

      const result = await getCommentsUseCase.execute({
        postId: announcementId,
        currentUserId: req.user?.userId,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      const commentRepository = new CommentRepository();
      const totalCommentsIncludingReplies = await commentRepository.countByPost(announcementId);

      console.log('Comments result:', result);

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
      console.error('Error in getCommentsByAnnouncement:', error);
      next(error);
    }
  }

  async getCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { announcementId } = req.params;

      const commentRepository = new CommentRepository();
      const totalCount = await commentRepository.countByPost(announcementId);
      const topLevelCount = await commentRepository.countTopLevelByPost(announcementId);

      res.status(200).json({
        success: true,
        data: {
          count: totalCount,
          topLevelCount,
          repliesCount: totalCount - topLevelCount
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

      const newTotalCommentCount = await commentRepository.countByPost(existingComment.postId);

      const announcement = await announcementRepository.findById(existingComment.postId);
      if (announcement) {
        announcement.commentsCount = newTotalCommentCount;
        await announcementRepository.update(announcement);
      }

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
        newCommentsCount: newTotalCommentCount
      });
    } catch (error) {
      console.error('Error in deleteComment for announcement:', error);
      next(error);
    }
  }
}