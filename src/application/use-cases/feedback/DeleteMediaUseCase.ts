import { S3StorageService } from "../../../infrastructure/services/S3StorageService";

// backend/src/application/use-cases/feedback/DeleteMediaUseCase.ts
export interface DeleteMediaRequest {
    mediaUrls: string[];
}

export class DeleteMediaUseCase {
    constructor(private storageService: S3StorageService) { }

    async execute(request: DeleteMediaRequest): Promise<void> {
        const { mediaUrls } = request;

        if (!mediaUrls || !Array.isArray(mediaUrls)) {
            throw new Error('Invalid media URLs');
        }

        await this.storageService.deleteMultipleCommunityMedia(mediaUrls);
    }
}