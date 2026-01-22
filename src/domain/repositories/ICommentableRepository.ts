export interface ICommentableRepository {
  findById(id: string, currentUserId?: string): Promise<{ id: string } | null>;
}