import { Comment } from './../entities/Comment';

export interface PaginationOptions {
  page: number;
  limit: number;
  excludeReplies?: boolean;
}

export interface PaginatedCommentsResult {
  comments: Comment[];
  total: number;
}

export interface ICommentRepository {
  create(comment: Comment): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findByPostId(postId: string, options?: PaginationOptions): Promise<PaginatedCommentsResult>;
  findReplies(parentCommentId: string): Promise<Comment[]>;
  update(comment: Comment): Promise<Comment>;
  delete(id: string): Promise<boolean>;
  countByPost(postId: string): Promise<number>;
}