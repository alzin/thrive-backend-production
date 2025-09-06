// backend/src/infrastructure/web/controllers/community.controller.ts - Updated to handle both posts and announcements
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreatePostUseCase } from '../../../application/use-cases/community/CreatePostUseCase';
import { ToggleLikeUseCase } from '../../../application/use-cases/community/ToggleLikeUseCase';
import { GetCommentsUseCase } from "../../../application/use-cases/community/GetCommentsUseCase";
import { CreateCommentUseCase } from "../../../application/use-cases/community/CreateCommentUseCase";
import { PostRepository } from '../../database/repositories/PostRepository';
import { PostLikeRepository } from '../../database/repositories/PostLikeRepository';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ProfileRepository } from '../../database/repositories/ProfileRepository';
import { CommentRepository } from "../../database/repositories/CommentRepository";
import { AnnouncementRepository } from "../../database/repositories/AnnouncementRepository"; // Add this import
import { ActivityService } from '../../services/ActivityService';
import { S3StorageService } from '../../services/S3StorageService';

export class CommunityController {
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

      for (const file of files) {
        try {
          S3StorageService.validateCommunityMediaFile(file);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

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

      await this.storageService.deleteMultipleCommunityMedia(mediaUrls);
      res.json({ message: 'Media files deleted successfully' });
    } catch (error) {
      console.error('Media deletion error:', error);
      next(error);
    }
  }

  // ... Keep all existing post methods unchanged ...

  async createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, mediaUrls } = req.body;

      const createPostUseCase = new CreatePostUseCase(
        new PostRepository(),
        new UserRepository(),
        new ProfileRepository(),
        new ActivityService()
      );

      const post = await createPostUseCase.execute({
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
      const postRepository = new PostRepository();

      const offset = (Number(page) - 1) * Number(limit);
      const result = await postRepository.findAll(Number(limit), offset, req.user!.userId);

      res.json({
        posts: result.posts,
        total: result.total,
        page: Number(page),
        totalPages: Math.ceil(result.total / Number(limit))
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;

      const toggleLikeUseCase = new ToggleLikeUseCase(
        new PostRepository(),
        new PostLikeRepository()
      );

      const result = await toggleLikeUseCase.execute({
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

      const postRepository = new PostRepository();
      const post = await postRepository.findById(postId);

      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      if (post.author?.userId !== req.user?.userId && req.user?.role !== "ADMIN") {
        res.status(403).json({ error: "Not authorized to delete this post" });
        return;
      }

      if (post.mediaUrls && post.mediaUrls.length > 0) {
        try {
          await this.storageService.deleteMultipleCommunityMedia(post.mediaUrls);
        } catch (error) {
          console.warn('Failed to delete media files:', error);
        }
      }

      const deleted = await postRepository.delete(postId);
      if (!deleted) {
        res.status(500).json({ error: 'Failed to delete post' });
        return;
      }

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async editPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params
      const { content, mediaUrls, removedMediaUrls } = req.body

      const postRepository = new PostRepository()
      const post = await postRepository.findById(postId);

      if (!post) {
        res.status(404).json({ error: "Post not found" })
        return;
      }

      if (post.author.userId !== req.user?.userId && req.user?.role !== "ADMIN") {
        res.status(403).json({ error: "Not authorized to edit this post" })
        return;
      }

      if (removedMediaUrls && removedMediaUrls.length > 0) {
        try {
          await this.storageService.deleteMultipleCommunityMedia(removedMediaUrls);
        } catch (error) {
          console.warn('Failed to delete removed media files:', error);
        }
      }

      post.content = content;
      post.mediaUrls = mediaUrls || [];
      post.updatedAt = new Date()

      const updatedPost = await postRepository.update(post)

      if (!updatedPost) {
        res.status(500).json({ error: "Failed to edit post" })
        return;
      }

      res.json({ message: "Post edited successfully", post: updatedPost })

    } catch (error) {
      return next(error)
    }
  }

  // UPDATED: Comments Operations - Now supports both Posts and Announcements
  async getCommentsByPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params; // This can be either a post ID or announcement ID
      const { page = 1, limit = 20, includeReplies = true } = req.query;

      console.log('Getting comments for content:', postId, { page, limit, includeReplies });

      const getCommentsUseCase = new GetCommentsUseCase(
        new CommentRepository(),
        new UserRepository(),
        new ProfileRepository()
      );

      const result = await getCommentsUseCase.execute({
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

      const commentRepository = new CommentRepository();
      const totalCommentsIncludingReplies = await commentRepository.countByPost(postId);

      console.log('Comments result:', result);

      res.status(200).json({
        success: true,
        data: {
          comments: enhancedComments,
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

      // UPDATED: Use appropriate repository based on content type
      let commentableRepository;
      try {
        // Try to find as post first
        const postRepository = new PostRepository();
        const post = await postRepository.findById(postId);
        if (post) {
          commentableRepository = postRepository;
        } else {
          // If not found as post, try as announcement
          const announcementRepository = new AnnouncementRepository();
          const announcement = await announcementRepository.findById(postId);
          if (announcement) {
            commentableRepository = announcementRepository;
          } else {
            return res.status(404).json({
              success: false,
              message: "Content not found"
            });
          }
        }
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: "Content not found"
        });
      }

      const createCommentUseCase = new CreateCommentUseCase(
        new CommentRepository(),
        commentableRepository, // Dynamic repository
        new UserRepository(),
        new ProfileRepository()
      );

      const comment = await createCommentUseCase.execute({
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

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "Comment content is required"
        });
        return;
      }

      if (content.trim().length > 1000) {
        res.status(400).json({
          success: false,
          message: "Comment content must not exceed 1000 characters"
        });
        return;
      }

      const commentRepository = new CommentRepository();
      const userRepository = new UserRepository();
      const profileRepository = new ProfileRepository();

      const existingComment = await commentRepository.findById(commentId);

      if (!existingComment) {
        res.status(404).json({
          success: false,
          message: "Comment not found"
        });
        return;
      }

      if (existingComment.userId !== userId) {
        res.status(403).json({
          success: false,
          message: "You can only edit your own comments"
        });
        return;
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

      // CRITICAL: Include replies for parent comments (works for both posts and announcements)
      if (updatedComment.parentCommentId === null || updatedComment.parentCommentId === undefined) {
        const replies = await commentRepository.findReplies(commentId);
        
        const enrichedReplies = await Promise.all(
          replies.map(async (reply) => {
            const replyUser = await userRepository.findById(reply.userId);
            const replyProfile = await profileRepository.findByUserId(reply.userId);

            reply.author = {
              userId: reply.userId,
              name: replyProfile?.name || replyUser?.email?.split('@')[0] || 'Unknown User',
              email: replyUser?.email || '',
              avatar: replyProfile?.profilePhoto || '',
              level: replyProfile?.level || 1,
            };

            return reply;
          })
        );

        updatedComment.replies = enrichedReplies;
      }

      res.status(200).json({
        success: true,
        data: updatedComment
      });
    } catch (error) {
      console.error('Error in updateComment:', error);
      next(error);
    }
  }

  // ... Keep all other existing methods unchanged ...

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
      const { postId } = req.params; // Can be post ID or announcement ID

      const commentRepository = new CommentRepository();
      const totalCount = await commentRepository.countByPost(postId);
      const topLevelCount = await commentRepository.countTopLevelByPost(postId);

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