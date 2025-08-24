import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { GetCommentsUseCase } from "../../../application/use-cases/community/GetCommentsUseCase";
import { CreateCommentUseCase } from "../../../application/use-cases/community/CreateCommentUseCase";
import { UserRepository } from "../../database/repositories/UserRepository";
import { ProfileRepository } from "../../database/repositories/ProfileRepository";
import { CommentRepository } from "../../database/repositories/CommentRepository";
import { PostRepository } from "../../database/repositories/PostRepository";

export class CommentController {
  async getCommentsByPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20, includeReplies = true } = req.query;

      console.log('Getting comments for post:', postId, { page, limit, includeReplies });

      const getCommentsUseCase = new GetCommentsUseCase(
        new CommentRepository(),
        new UserRepository(),
        new ProfileRepository()
      );

      const result = await getCommentsUseCase.execute({
        postId,
        currentUserId: req.user?.userId,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      console.log('Comments result:', result);

      res.status(200).json({
        success: true,
        data: {
          comments: result.comments,
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
      console.error('Error in getCommentsByPost:', error);
      next(error);
    }
  }

  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user?.userId;

      console.log('Creating comment:', { postId, userId, content, parentCommentId });

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
        new PostRepository(),
        new UserRepository(),
        new ProfileRepository()
      );

      const comment = await createCommentUseCase.execute({
        userId,
        postId,
        content: content.trim(),
        parentCommentId
      });

      console.log('Comment created:', comment);

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Error in createComment:', error);
      next(error);
    }
  }

  async getCommentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;

      const commentRepository = new CommentRepository();
      const userRepository = new UserRepository();
      const profileRepository = new ProfileRepository();

      const comment = await commentRepository.findById(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found"
        });
      }

      // Enrich with author information
      const user = await userRepository.findById(comment.userId);
      const profile = await profileRepository.findByUserId(comment.userId);
      
      comment.author = {
        userId: comment.userId,
        name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
        email: user?.email || '',
        avatar: profile?.profilePhoto || '',
        level: profile?.level || 1,
      };

      res.status(200).json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Error in getCommentById:', error);
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

      // Check if user owns the comment
      if (existingComment.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own comments"
        });
      }

      // Update the comment
      existingComment.content = content.trim();
      existingComment.updatedAt = new Date();

      const updatedComment = await commentRepository.update(existingComment);

      // Enrich with author information
      const user = await userRepository.findById(updatedComment.userId);
      const profile = await profileRepository.findByUserId(updatedComment.userId);
      
      updatedComment.author = {
        userId: updatedComment.userId,
        name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
        email: user?.email || '',
        avatar: profile?.profilePhoto || '',
        level: profile?.level || 1,
      };

      res.status(200).json({
        success: true,
        data: updatedComment
      });
    } catch (error) {
      console.error('Error in updateComment:', error);
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

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully"
      });
    } catch (error) {
      console.error('Error in deleteComment:', error);
      next(error);
    }
  }

  async getReplies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;

      const commentRepository = new CommentRepository();
      const userRepository = new UserRepository();
      const profileRepository = new ProfileRepository();

      const replies = await commentRepository.findReplies(commentId);

      // Enrich replies with author information
      const enrichedReplies = await Promise.all(
        replies.map(async (reply) => {
          const user = await userRepository.findById(reply.userId);
          const profile = await profileRepository.findByUserId(reply.userId);
          
          reply.author = {
            userId: reply.userId,
            name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
            email: user?.email || '',
            avatar: profile?.profilePhoto || '',
            level: profile?.level || 1,
          };

          return reply;
        })
      );

      res.status(200).json({
        success: true,
        data: enrichedReplies
      });
    } catch (error) {
      console.error('Error in getReplies:', error);
      next(error);
    }
  }

  async getCommentCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;

      const commentRepository = new CommentRepository();
      const count = await commentRepository.countByPost(postId);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      next(error);
    }
  }
}