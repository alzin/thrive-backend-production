import { PostLike } from "../entities/PostLike";

export interface IPostLikeRepository {
  create(postLike: PostLike): Promise<PostLike>;
  findByUserAndPost(userId: string, postId: string): Promise<PostLike | null>;
  findByPost(postId: string): Promise<PostLike[]>;
  findByUser(userId: string): Promise<PostLike[]>;
  delete(userId: string, postId: string): Promise<boolean>;
  countByPost(postId: string): Promise<number>;
  findLikedPostsByUser(userId: string, postIds: string[]): Promise<string[]>;
}