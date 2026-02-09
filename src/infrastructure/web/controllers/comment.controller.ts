// backend/src/infrastructure/web/controllers/comment.controller.ts
import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { GetCommentsByPostUseCase } from "../../../application/use-cases/comment/GetCommentsByPostUseCase";
import { GetCommentWithRepliesUseCase } from "../../../application/use-cases/comment/GetCommentWithRepliesUseCase";
import { CreateCommentUseCase } from "../../../application/use-cases/community/CreateCommentUseCase";
import { GetCommentByIdUseCase } from "../../../application/use-cases/comment/GetCommentByIdUseCase";
import { UpdateCommentUseCase } from "../../../application/use-cases/comment/UpdateCommentUseCase";
import { DeleteCommentUseCase } from "../../../application/use-cases/comment/DeleteCommentUseCase";
import { GetRepliesUseCase } from "../../../application/use-cases/comment/GetRepliesUseCase";
import { GetCommentCountUseCase } from "../../../application/use-cases/comment/GetCommentCountUseCase";

export class CommentController {
  constructor(
    private getCommentsByPostUseCase: GetCommentsByPostUseCase,
    private getCommentWithRepliesUseCase: GetCommentWithRepliesUseCase,
    private createCommentUseCase: CreateCommentUseCase,
    private getCommentByIdUseCase: GetCommentByIdUseCase,
    private updateCommentUseCase: UpdateCommentUseCase,
    private deleteCommentUseCase: DeleteCommentUseCase,
    private getRepliesUseCase: GetRepliesUseCase,
    private getCommentCountUseCase: GetCommentCountUseCase
  ) { }

  async getCommentsByPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20, includeReplies = true } = req.query;

      console.log('Getting comments for post:', postId, { page, limit, includeReplies });

      const result = await this.getCommentsByPostUseCase.execute({
        postId,
        currentUserId: req.user?.userId,
        userRole: req.user?.role,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      console.log('Comments result:', result);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getCommentsByPost:', error);
      next(error);
    }
  }

  async getCommentWithReplies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;

      const comment = await this.getCommentWithRepliesUseCase.execute({
        commentId
      });

      res.status(200).json({
        success: true,
        data: comment
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Comment not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      console.error('Error in getCommentWithReplies:', error);
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

      const comment = await this.createCommentUseCase.execute({
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

      const comment = await this.getCommentByIdUseCase.execute({
        commentId
      });

      res.status(200).json({
        success: true,
        data: comment
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Comment not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
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

      const updatedComment = await this.updateCommentUseCase.execute({
        commentId,
        content,
        userId
      });

      res.status(200).json({
        success: true,
        data: updatedComment
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
      }
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

      const result = await this.deleteCommentUseCase.execute({
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
      console.error('Error in deleteComment:', error);
      next(error);
    }
  }

  async getReplies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;

      const enrichedReplies = await this.getRepliesUseCase.execute({
        commentId
      });

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

      const result = await this.getCommentCountUseCase.execute({
        postId
      });

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