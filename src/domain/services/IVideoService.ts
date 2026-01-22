export interface VideoInfo {
  duration: number;
  thumbnail: string;
  embedUrl: string;
}

export interface IVideoService {
  uploadVideo(file: Buffer, title: string): Promise<string>;
  getVideoInfo(videoId: string): Promise<VideoInfo>;
  generateEmbedUrl(videoId: string): string;
  deleteVideo(videoId: string): Promise<void>;
}