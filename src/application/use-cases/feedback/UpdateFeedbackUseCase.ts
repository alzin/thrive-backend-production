import { FeedbackRepository } from "../../../infrastructure/database/repositories/FeedbackRepository";
import { S3StorageService } from "../../../infrastructure/services/S3StorageService";

export interface UpdateFeedbackRequest {
    feedbackId: string;
    userId: string;
    userRole: string;
    content: string;
    mediaUrls?: string[];
    removedMediaUrls?: string[];
}

export class UpdateFeedbackUseCase {
    constructor(
        private feedbackRepository: FeedbackRepository,
        private storageService: S3StorageService
    ) { }

    async execute(request: UpdateFeedbackRequest): Promise<any> {
        const { feedbackId, userId, userRole, content, mediaUrls, removedMediaUrls } = request;

        const feedback = await this.feedbackRepository.findById(feedbackId);

        if (!feedback) {
            throw new Error("Feedback not found");
        }

        if (feedback.author.userId !== userId && userRole !== "ADMIN") {
            throw new Error("Not authorized to edit this feedback");
        }

        // Delete removed media files from S3
        if (removedMediaUrls && removedMediaUrls.length > 0) {
            try {
                await this.storageService.deleteMultipleCommunityMedia(removedMediaUrls);
            } catch (error) {
                console.warn('Failed to delete removed media files:', error);
                // Continue with feedback update even if media deletion fails
            }
        }

        feedback.content = content;
        feedback.mediaUrls = mediaUrls || [];
        feedback.updatedAt = new Date();

        const updatedFeedback = await this.feedbackRepository.update(feedback);
        return updatedFeedback;
    }
}