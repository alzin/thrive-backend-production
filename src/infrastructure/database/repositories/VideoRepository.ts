import { Repository } from 'typeorm';
import { Video, VideoType } from '../../../domain/entities/Video';
import { IVideoRepository } from '../../../domain/repositories/IVideoRepository';
import { VideoEntity } from '../entities/Video.entity';
import { AppDataSource } from '../config/database.config';

export class VideoRepository implements IVideoRepository {
  private repository: Repository<VideoEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(VideoEntity);
  }

  async create(video: Video): Promise<Video> {
    // Only allow one video - clear existing first
    await this.repository.clear();
    
    const entity = this.toEntity(video);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findFirst(): Promise<Video | null> {
    const entity = await this.repository.findOne({
      where: {},
      relations: ['creator'],
      order: { createdAt: 'DESC' }
    });

    return entity ? this.toDomain(entity) : null;
  }

  async update(video: Video): Promise<Video> {
    const entity = this.toEntity(video);
    
    await this.repository.update(entity.id, {
      // title: entity.title,
      description: entity.description,
      videoUrl: entity.videoUrl,
      videoType: entity.videoType,
      thumbnailUrl: entity.thumbnailUrl,
      // duration: entity.duration,
      isActive: entity.isActive,
      updatedAt: new Date()
    });
    
    const updatedEntity = await this.repository.findOne({ 
      where: { id: entity.id },
      relations: ['creator']
    });
    
    if (!updatedEntity) {
      throw new Error('Failed to update video');
    }
    
    return this.toDomain(updatedEntity);
  }

  async delete(): Promise<boolean> {
    try {
      await this.repository.clear();
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  async exists(): Promise<boolean> {
    const count = await this.repository.count();
    return count > 0;
  }

  private toEntity(video: Video): VideoEntity {
    const entity = new VideoEntity();
    entity.id = video.id;
    // entity.title = video.title;
    entity.description = video.description;
    entity.videoUrl = video.videoUrl;
    entity.videoType = video.videoType;
    entity.thumbnailUrl = video.thumbnailUrl;
    // entity.duration = video.duration;
    entity.isActive = video.isActive;
    entity.createdBy = video.createdBy;
    entity.createdAt = video.createdAt;
    entity.updatedAt = video.updatedAt;
    return entity;
  }

  private toDomain(entity: VideoEntity): Video {
    return new Video(
      entity.id,
      // entity.title,
      entity.description,
      entity.videoUrl,
      entity.videoType,
      entity.thumbnailUrl,
      // entity.duration,
      entity.isActive,
      entity.createdBy,
      entity.createdAt,
      entity.updatedAt
    );
  }
}