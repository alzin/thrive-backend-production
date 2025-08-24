import { IPostRepository } from '../../../domain/repositories/IPostRepository';
import { PostLikeRepository } from '../../../infrastructure/database/repositories/PostLikeRepository';
import { PostLike } from '../../../domain/entities/PostLike';

export interface ToggleLikeDTO {
  userId: string;
  postId: string;
}

export interface ToggleLikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export class ToggleLikeUseCase {
  constructor(
    private postRepository: IPostRepository,
    private postLikeRepository: PostLikeRepository
  ) {}

  async execute(dto: ToggleLikeDTO): Promise<ToggleLikeResponse> {
    const { userId, postId } = dto;

    // Check if post exists (pass currentUserId to get isLiked status)
    const post = await this.postRepository.findById(postId, userId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user already liked the post
    const existingLike = await this.postLikeRepository.findByUserAndPost(userId, postId);

    if (existingLike) {
      // Unlike the post
      await this.postLikeRepository.delete(userId, postId);
      await this.postRepository.decrementLikes(postId);
      
      return {
        isLiked: false,
        likesCount: Math.max(0, post.likesCount - 1)
      };
    } else {
      // Like the post
      const newLike = new PostLike(
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        userId,
        postId,
        new Date()
      );
      
      await this.postLikeRepository.create(newLike);
      await this.postRepository.incrementLikes(postId);
      
      return {
        isLiked: true,
        likesCount: post.likesCount + 1
      };
    }
  }
}