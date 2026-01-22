import { FeedbackRepository } from "../../../infrastructure/database/repositories/FeedbackRepository";
import { S3StorageService } from "../../../infrastructure/services/S3StorageService";

export interface DeleteFeedbackRequest {
    feedbackId: string;
    userId: string;
    userRole: string;
}

export class DeleteFeedbackUseCase {
    constructor(
        private feedbackRepository: FeedbackRepository,
        private storageService: S3StorageService
    ) { }

    async execute(request: DeleteFeedbackRequest): Promise<void> {
        const { feedbackId, userId, userRole } = request;

        const feedback = await this.feedbackRepository.findById(feedbackId);

        if (!feedback) {
            throw new Error("Feedback not found");
        }

        if (feedback.author?.userId !== userId && userRole !== "ADMIN") {
            throw new Error("Not authorized to delete this feedback");
        }

        // Delete associated media files from S3 before deleting the feedback
        if (feedback.mediaUrls && feedback.mediaUrls.length > 0) {
            try {
                await this.storageService.deleteMultipleCommunityMedia(feedback.mediaUrls);
            } catch (error) {
                console.warn('Failed to delete media files:', error);
                // Continue with feedback deletion even if media deletion fails
            }
        }

        const deleted = await this.feedbackRepository.delete(feedbackId);
        if (!deleted) {
            throw new Error('Failed to delete feedback');
        }
    }
}