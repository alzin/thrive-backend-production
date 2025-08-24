import { IStorageService, UploadedFile } from '../../application/services/IStorageService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class StorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<UploadedFile> {
    const key = `${uuidv4()}-${filename}`;
    const filePath = path.join(this.uploadDir, key);
    
    await fs.writeFile(filePath, file);

    return {
      url: `/uploads/${key}`,
      key,
      size: file.length,
      mimeType
    };
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    await fs.unlink(filePath);
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    // In a production environment, this would generate a signed URL
    // For local development, we'll return a direct URL
    return `/uploads/${key}`;
  }

  async uploadProfilePhoto(userId: string, file: Buffer, mimeType: string): Promise<string> {
    const extension = mimeType.split('/')[1];
    const filename = `profile-${userId}.${extension}`;
    const result = await this.uploadFile(file, filename, mimeType);
    return result.url;
  }

  async uploadLessonResource(lessonId: string, file: Buffer, filename: string, mimeType: string): Promise<string> {
    const key = `lessons/${lessonId}/${filename}`;
    const result = await this.uploadFile(file, key, mimeType);
    return result.url;
  }
}