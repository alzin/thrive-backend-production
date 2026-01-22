// backend/src/application/use-cases/feedback/UploadMediaUseCase.ts
import { S3StorageService } from '../../../infrastructure/services/S3StorageService';

export interface UploadMediaRequest {
    userId: string;
    files: Array<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
    }>;
}

export interface UploadMediaResponse {
    files: Array<{
        url: string;
        size: number;
        mimeType: string;
    }>;
}

export class UploadMediaUseCase {
    constructor(private storageService: S3StorageService) { }

    async execute(request: UploadMediaRequest): Promise<UploadMediaResponse> {
        const { userId, files } = request;

        // Validate files
        for (const file of files) {
            S3StorageService.validateCommunityMediaFile({
                buffer: file.buffer,
                originalname: file.filename,
                mimetype: file.mimeType,
            } as Express.Multer.File);
        }

        const uploadedFiles = await this.storageService.uploadMultipleCommunityMedia(
            userId,
            files
        );

        return {
            files: uploadedFiles.map(file => ({
                url: file.url,
                size: file.size,
                mimeType: file.mimeType,
            })),
        };
    }
}