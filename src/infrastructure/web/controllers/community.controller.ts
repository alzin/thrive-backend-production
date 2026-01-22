import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AnnouncementRepository } from '../../database/repositories/AnnouncementRepository';

// Use Cases
import { UploadMediaUseCase } from '../../../application/use-cases/community/UploadMediaUseCase';
import { DeleteMediaUseCase } from '../../../application/use-cases/community/DeleteMediaUseCase';
import { CreatePostUseCase } from '../../../application/use-cases/community/CreatePostUseCase';
import { GetPostsUseCase } from '../../../application/use-cases/community/GetPostsUseCase';
import { ToggleLikeUseCase } from '../../../application/use-cases/community/ToggleLikeUseCase';
import { DeletePostUseCase } from '../../../application/use-cases/community/DeletePostUseCase';
import { EditPostUseCase } from '../../../application/use-cases/community/EditPostUseCase';
import { GetCommentsUseCase } from "../../../application/use-cases/community/GetCommentsUseCase";
import { CreateCommentForAllUseCase } from "../../../application/use-cases/community/CreateCommentForAllUseCase";
import { UpdateCommentUseCase } from '../../../application/use-cases/community/UpdateCommentUseCase';
import { GetCommentByIdUseCase } from '../../../application/use-cases/community/GetCommentByIdUseCase';
import { DeleteCommentUseCase } from '../../../application/use-cases/community/DeleteCommentUseCase';
import { GetRepliesUseCase } from '../../../application/use-cases/community/GetRepliesUseCase';
import { GetCommentCountUseCase } from '../../../application/use-cases/community/GetCommentCountUseCase';

export class CommunityController {
  constructor(
    // Media use cases
    private uploadMediaUseCase: UploadMediaUseCase,
    private deleteMediaUseCase: DeleteMediaUseCase,

    // Post use cases
    private createPostUseCase: CreatePostUseCase,
    private getPostsUseCase: GetPostsUseCase,
    private toggleLikeUseCase: ToggleLikeUseCase,
    private deletePostUseCase: DeletePostUseCase,
    private editPostUseCase: EditPostUseCase,

    // Comment use cases
    private getCommentsUseCase: GetCommentsUseCase,
    private createCommentForAllUseCase: CreateCommentForAllUseCase,
    private updateCommentUseCase: UpdateCommentUseCase,
    private getCommentByIdUseCase: GetCommentByIdUseCase,
    private deleteCommentUseCase: DeleteCommentUseCase,
    private getRepliesUseCase: GetRepliesUseCase,
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

  async createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, mediaUrls } = req.body;

      const post = await this.createPostUseCase.execute({
        userId: req.user!.userId,
        content,
        mediaUrls: mediaUrls || [],
      });

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

  async getPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await this.getPostsUseCase.execute({
        userId: req.user!.userId,
        page: Number(page),
        limit: Number(limit)
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;

      const result = await this.toggleLikeUseCase.execute({
        userId: req.user!.userId,
        postId
      });

      res.json({
        message: result.isLiked ? 'Post liked' : 'Post dislike',
        isLiked: result.isLiked,
        likesCount: result.likesCount
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;

      await this.deletePostUseCase.execute({
        postId,
        userId: req.user!.userId,
        userRole: req.user!.role
      });

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Post not found") {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === "Not authorized to delete this post") {
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message === 'Failed to delete post') {
          res.status(500).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  async editPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const { content, mediaUrls, removedMediaUrls } = req.body;

      const updatedPost = await this.editPostUseCase.execute({
        postId,
        userId: req.user!.userId,
        userRole: req.user!.role,
        content,
        mediaUrls,
        removedMediaUrls
      });

      res.json({ message: "Post edited successfully", post: updatedPost });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Post not found") {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === "Not authorized to edit this post") {
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message === "Failed to edit post") {
          res.status(500).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  async getCommentsByPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params; // This can be either a post ID or announcement ID
      const { page = 1, limit = 20, includeReplies = true } = req.query;

      console.log('Getting comments for content:', postId, { page, limit, includeReplies });

      const result = await this.getCommentsUseCase.execute({
        postId, // Generic - works for both posts and announcements
        currentUserId: req.user?.userId,
        page: Number(page),
        limit: Number(limit),
        includeReplies: String(includeReplies).toLowerCase() === 'true'
      });

      // Backend enhancement: Add metadata to help frontend handle editing states
      const enhancedComments = result.comments.map(comment => ({
        ...comment,
        canEdit: comment.author?.userId === req.user?.userId,
        canDelete: comment.author?.userId === req.user?.userId || req.user?.role === 'ADMIN',
        hasReplies: comment.replies && comment.replies.length > 0,
        replies: comment.replies || []
      }));

      const totalCommentsIncludingReplies = await this.getCommentCountUseCase.execute({ postId });

      console.log('Comments result:', result);

      res.status(200).json({
        success: true,
        data: {
          comments: enhancedComments,
          pagination: {
            total: result.total,
            totalWithReplies: totalCommentsIncludingReplies.count,
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
      const { postId } = req.params; // Can be post ID or announcement ID
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

      // NOTE: The use case will handle determining whether postId is for a post or announcement
      const comment = await this.createCommentForAllUseCase.execute({
        userId,
        postId, // Generic - works for both posts and announcements
        content: content.trim(),
        parentCommentId
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Content not found") {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      console.error('Error in createComment:', error);
      next(error);
    }
  }

  async updateComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const updatedComment = await this.updateCommentUseCase.execute({
        commentId,
        userId,
        content
      });

      res.status(200).json({
        success: true,
        data: updatedComment
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Comment content is required" ||
          error.message === "Comment content must not exceed 1000 characters") {
          res.status(400).json({
            success: false,
            message: error.message
          });
          return;
        }
        if (error.message === "Comment not found") {
          res.status(404).json({
            success: false,
            message: error.message
          });
          return;
        }
        if (error.message === "You can only edit your own comments") {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
      }
      console.error('Error in updateComment:', error);
      next(error);
    }
  }

  async getCommentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;

      const comment = await this.getCommentByIdUseCase.execute({ commentId });

      res.status(200).json({
        success: true,
        data: comment
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Comment not found") {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      console.error('Error in getCommentById:', error);
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

      await this.deleteCommentUseCase.execute({ commentId, userId });

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully"
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Comment not found") {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        if (error.message === "You can only delete your own comments") {
          return res.status(403).json({
            success: false,
            message: error.message
          });
        }
        if (error.message === "Failed to delete comment") {
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

      const enrichedReplies = await this.getRepliesUseCase.execute({ commentId });

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
      const { postId } = req.params; // Can be post ID or announcement ID

      const result = await this.getCommentCountUseCase.execute({ postId });

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