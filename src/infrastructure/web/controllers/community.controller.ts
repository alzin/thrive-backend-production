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
import { ActivityService } from '../../services/ActivityService';
import { S3StorageService } from '../../services/S3StorageService';

export class CommunityController {
  private storageService: S3StorageService;

  constructor() {
    this.storageService = new S3StorageService();
  }

  async uploadMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('uploadMedia called');
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);
    console.log('Files array check:', Array.isArray(req.files));
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log('No files uploaded - req.files:', req.files);
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const userId = req.user!.userId;

    console.log('Processing files:', files.map(f => ({ 
      fieldname: f.fieldname,
      originalname: f.originalname, 
      mimetype: f.mimetype, 
      size: f.size 
    })));

    // Validate all files before processing
    for (const file of files) {
      try {
        S3StorageService.validateCommunityMediaFile(file);
      } catch (error: any) {
        console.log('File validation failed:', error.message);
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

  async createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, mediaUrls   } = req.body;

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

      // Delete associated media files from S3 before deleting the post
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        try {
          await this.storageService.deleteMultipleCommunityMedia(post.mediaUrls);
        } catch (error) {
          console.warn('Failed to delete media files:', error);
          // Continue with post deletion even if media deletion fails
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

      // Delete removed media files from S3
      if (removedMediaUrls && removedMediaUrls.length > 0) {
        try {
          await this.storageService.deleteMultipleCommunityMedia(removedMediaUrls);
        } catch (error) {
          console.warn('Failed to delete removed media files:', error);
          // Continue with post update even if media deletion fails
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

  // Comments Operations
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

      // Get the total count of ALL comments (including replies) for accurate count
      const commentRepository = new CommentRepository();
      const totalCommentsIncludingReplies = await commentRepository.countByPost(postId);

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
      new PostRepository(), // PostRepository implements ICommentableRepository
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

      // Get total count including all replies
      const totalCount = await commentRepository.countByPost(postId);

      // Optionally also get top-level count
      const topLevelCount = await commentRepository.countTopLevelByPost(postId);

      res.status(200).json({
        success: true,
        data: {
          count: totalCount, // Total including replies
          topLevelCount, // Just top-level comments
          repliesCount: totalCount - topLevelCount // Number of replies
        }
      });
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      next(error);
    }
  }
}