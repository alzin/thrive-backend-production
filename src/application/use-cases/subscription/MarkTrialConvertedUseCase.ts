// backend/src/application/use-cases/subscription/MarkTrialConvertedUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export interface MarkTrialConvertedDTO {
  userId: string;
  planType: string;
}

export interface MarkTrialConvertedResponse {
  success: boolean;
  shouldFireAnalytics: boolean; // Only true if this is the first conversion
  planType: string;
}

/**
 * Use case to mark a user's free trial as converted to paid.
 * This ensures the trial_converted_to_paid analytics event fires only ONCE per user.
 */
export class MarkTrialConvertedUseCase {
  constructor(
    private userRepository: IUserRepository
  ) { }

  async execute(dto: MarkTrialConvertedDTO): Promise<MarkTrialConvertedResponse> {
    const { userId, planType } = dto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already converted - prevent duplicate analytics
    if (user.trialConvertedToPaid) {
      return {
        success: true,
        shouldFireAnalytics: false, // Already converted, don't fire again
        planType,
      };
    }

    // Check if user was in free trial (had trial dates set)
    const wasInTrial = user.trialStartDate !== null && user.trialEndDate !== null;

    if (!wasInTrial) {
      // User wasn't in free trial, this is a direct purchase
      return {
        success: true,
        shouldFireAnalytics: false,
        planType,
      };
    }

    // Mark as converted
    user.trialConvertedToPaid = true;
    user.updatedAt = new Date();

    await this.userRepository.update(user);

    return {
      success: true,
      shouldFireAnalytics: true, // First conversion, fire analytics
      planType,
    };
  }
}
