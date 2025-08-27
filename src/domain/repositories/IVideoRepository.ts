// backend/src/domain/repositories/IVideoRepository.ts
import { Video } from '../entities/Video';

export interface IVideoRepository {
  create(video: Video): Promise<Video>;
  findFirst(): Promise<Video | null>; // Get the single video
  update(video: Video): Promise<Video>;
  delete(): Promise<boolean>; // Delete the single video
  exists(): Promise<boolean>; // Check if video exists
}
