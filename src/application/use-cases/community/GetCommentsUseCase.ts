import { Comment } from "../../../domain/entities/Comment";
import { ICommentRepository } from "../../../domain/repositories/ICommentRepository";
import { IProfileRepository } from "../../../domain/repositories/IProfileRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";

export interface GetCommentsDTO {
  postId: string;
  currentUserId?: string;
  page?: number;
  limit?: number;
  includeReplies?: boolean;
}

export interface GetCommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

export class GetCommentsUseCase {
  constructor(
    private commentRepository: ICommentRepository,
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: GetCommentsDTO): Promise<GetCommentsResponse> {
    const { postId, page = 1, limit = 20, includeReplies = true } = dto;

    // 1. Get main comments (exclude replies if not including them)
    const { comments, total } = await this.commentRepository.findByPostId(
      postId, 
      { page, limit, excludeReplies: !includeReplies }
    );

    // 2. Enrich comments with author info and get replies if needed
    const enrichedComments = await Promise.all(
      comments.map(async (comment: Comment) => {
        // Get author info for the main comment
        const author = await this.getAuthorInfo(comment.userId);
        comment.author = author;

        // If including replies, get nested comments with their author info
        if (includeReplies) {
          const replies = await this.commentRepository.findReplies(comment.id);
          comment.replies = await Promise.all(
            replies.map(async (reply: Comment) => {
              const replyAuthor = await this.getAuthorInfo(reply.userId);
              reply.author = replyAuthor;
              return reply;
            })
          );
        }

        return comment;
      })
    );

    return {
      comments: enrichedComments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  private async getAuthorInfo(userId: string) {
    const user = await this.userRepository.findById(userId);
    const profile = await this.profileRepository.findByUserId(userId);
    
    return {
      userId,
      name: profile?.name || user?.email?.split('@')[0] || 'Unknown User',
      email: user?.email || '',
      avatar: profile?.profilePhoto || '',
      level: profile?.level || 1,
    };
  }
}