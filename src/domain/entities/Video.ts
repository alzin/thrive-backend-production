// backend/src/domain/entities/Video.ts
export enum VideoType {
  YOUTUBE = 'YOUTUBE',
  S3 = 'S3'
}

export interface IVideo {
  id: string;
  // title: string;
  description: string;
  videoUrl: string;
  videoType: VideoType;
  thumbnailUrl?: string;
  // duration?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Video implements IVideo {
  constructor(
    public id: string,
    // public title: string,
    public description: string,
    public videoUrl: string,
    public videoType: VideoType,
    public thumbnailUrl: string | undefined,
    // public duration: number | undefined,
    public isActive: boolean,
    public createdBy: string,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  public getYouTubeVideoId(): string | null {
    if (this.videoType !== VideoType.YOUTUBE) return null;
    
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = this.videoUrl.match(regex);
    return match ? match[1] : null;
  }

  public getYouTubeThumbnail(): string | null {
    const videoId = this.getYouTubeVideoId();
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  }

  public isValidUrl(): boolean {
    if (this.videoType === VideoType.YOUTUBE) {
      return this.getYouTubeVideoId() !== null;
    } else if (this.videoType === VideoType.S3) {
      try {
        const url = new URL(this.videoUrl);
        return url.hostname.includes('amazonaws.com') || url.hostname.includes('s3');
      } catch {
        return false;
      }
    }
    return false;
  }
}