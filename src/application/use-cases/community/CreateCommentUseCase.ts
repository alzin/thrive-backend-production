// backend/src/application/use-cases/community/CreateCommentUseCase.ts (Updated)
import { Comment } from "../../../domain/entities/Comment";
import { ICommentRepository } from "../../../domain/repositories/ICommentRepository";
import { IProfileRepository } from "../../../domain/repositories/IProfileRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ICommentableRepository } from "../../../infrastructure/database/repositories/ICommentableRepository";

export interface CreateCommentDTO {
  userId: string;
  postId: string;
  content: string;
  parentCommentId?: string;
}

export class CreateCommentUseCase {
  constructor(
    private commentRepository: ICommentRepository,
    private commentableRepository: ICommentableRepository, // Changed from IPostRepository
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository
  ) { }

  async execute(dto: CreateCommentDTO): Promise<Comment> {
    // 1. Validate post/announcement exists
    const commentableItem = await this.commentableRepository.findById(dto.postId);
    if (!commentableItem) {
      throw new Error('Post or announcement not found');
    }

    // 2. Validate user exists and get user info in parallel with profile
    const [user, profile] = await Promise.all([
      this.userRepository.findById(dto.userId),
      this.profileRepository.findByUserId(dto.userId)
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    // 3. If it's a reply, validate parent comment exists
    let parentComment = null;
    if (dto.parentCommentId) {
      parentComment = await this.commentRepository.findById(dto.parentCommentId);
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }
      
      // Ensure the parent comment belongs to the same post/announcement
      if (parentComment.postId !== dto.postId) {
        throw new Error("Parent comment does not belong to this post or announcement");
      }
    }

    // 4. Create optimized author info object
    const author = {
      userId: dto.userId,
      name: profile?.name || user.email.split("@")[0] || 'Unknown User',
      email: user.email,
      avatar: profile?.profilePhoto || "",
      level: profile?.level || 1
    };

    // 5. Generate optimized comment ID
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // 6. Create comment instance with optimized structure
    const comment = new Comment(
      commentId,
      dto.postId,
      dto.userId,
      dto.content.trim(), // Ensure content is trimmed
      dto.parentCommentId,
      author,
      new Date(),
      new Date(),
      [] // Initialize empty replies array for consistency
    );

    // 7. Save comment to database
    const savedComment = await this.commentRepository.create(comment);

    // 8. Return the saved comment with pre-populated author info
    // This ensures the client gets the author info immediately without additional requests
    return {
      ...savedComment,
      author: author, // Ensure author info is always present
      replies: [] // Initialize empty replies for new comments
    };
  }
}