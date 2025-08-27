import { IVideoRepository } from '../../../domain/repositories/IVideoRepository';
import { Video } from '../../../domain/entities/Video';

export class GetVideoUseCase {
  constructor(private videoRepository: IVideoRepository) {}

  async execute(): Promise<Video | null> {
    return await this.videoRepository.findFirst();
  }

  async exists(): Promise<boolean> {
    return await this.videoRepository.exists();
  }
}
