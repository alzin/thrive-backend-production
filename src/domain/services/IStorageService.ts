export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface IStorageService {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<UploadedFile>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  uploadProfilePhoto(userId: string, file: Buffer, mimeType: string): Promise<string>;
  uploadLessonResource(lessonId: string, file: Buffer, filename: string, mimeType: string): Promise<string>;
}