import { ICommentableRepository } from './ICommentableRepository';
import { Post } from '../entities/Post';
import { Announcement } from '../entities/Announcement';

export interface IPostRepository extends ICommentableRepository {
  create(post: Post): Promise<Post>;
  findById(id: string, currentUserId?: string): Promise<Post | null>;
  findPostAndAnnouncementById(id: string, currentUserId?: string): Promise<Post | Announcement | null>;
  findAll(limit?: number, offset?: number, currentUserId?: string): Promise<{ posts: Post[]; total: number }>;
  findByUserId(userId: string, currentUserId?: string): Promise<Post[]>;
  update(post: Post): Promise<Post>;
  delete(id: string): Promise<boolean>;
  incrementLikes(id: string): Promise<Post | null>;
  decrementLikes(id: string): Promise<Post | null>;
}