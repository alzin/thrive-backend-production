// backend/src/domain/repositories/IAnnouncementRepository.ts
import { ICommentableRepository } from './ICommentableRepository';
import { Announcement } from '../entities/Announcement';


export interface IAnnouncementRepository extends ICommentableRepository {
  create(announcement: Announcement): Promise<Announcement>;
  findById(id: string, currentUserId?: string): Promise<Announcement | null>;
  findAll(limit?: number, offset?: number, currentUserId?: string): Promise<{ announcements: Announcement[]; total: number }>;
  findByUserId(userId: string, currentUserId?: string): Promise<Announcement[]>;
  update(announcement: Announcement): Promise<Announcement>;
  delete(id: string): Promise<boolean>;
  incrementLikes(id: string): Promise<Announcement | null>;
  decrementLikes(id: string): Promise<Announcement | null>;
}