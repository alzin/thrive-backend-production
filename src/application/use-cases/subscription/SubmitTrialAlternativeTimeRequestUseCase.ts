import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { IEmailService } from '../../../domain/services/IEmailService';
import { ITrialAlternativeTimeRequestRepository } from '../../../domain/repositories/ITrialAlternativeTimeRequestRepository';
import { TrialAlternativeTimeRequest } from '../../../domain/entities/TrialAlternativeTimeRequest';
import { ENV_CONFIG } from '../../../infrastructure/config/env.config';
import { v4 as uuidv4 } from 'uuid';

export interface SubmitTrialAlternativeTimeRequestDTO {
  userId: string;
  preferredTimes: string[];
  timeZone: string;
}

export class SubmitTrialAlternativeTimeRequestUseCase {
  private static readonly PRIMARY_TIME_ZONE = 'Asia/Tokyo';

  constructor(
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private emailService: IEmailService,
    private trialAlternativeTimeRequestRepository: ITrialAlternativeTimeRequestRepository
  ) { }

  async execute(dto: SubmitTrialAlternativeTimeRequestDTO): Promise<{ submittedAt: Date }> {
    const preferredTimes = (dto.preferredTimes || [])
      .map((time) => time?.trim())
      .filter((time): time is string => Boolean(time));
    const uniquePreferredTimes = Array.from(new Set(preferredTimes));

    const timeZone = SubmitTrialAlternativeTimeRequestUseCase.PRIMARY_TIME_ZONE;

    if (uniquePreferredTimes.length === 0) {
      throw new Error('At least one preferred time is required');
    }

    for (const time of uniquePreferredTimes) {
      const parsed = new Date(time);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error('Each preferred time must be a valid ISO date-time string');
      }
    }

    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = await this.profileRepository.findByUserId(dto.userId);
    const studentName = profile?.name || 'Student';
    const now = new Date();

    await this.emailService.sendTrialAlternativeTimeRequest(
      user.email,
      studentName,
      uniquePreferredTimes,
      timeZone,
      ENV_CONFIG.TRIAL_BOOKING_REQUEST_EMAIL,
      now
    );

    await this.trialAlternativeTimeRequestRepository.create(
      new TrialAlternativeTimeRequest(
        uuidv4(),
        dto.userId,
        uniquePreferredTimes,
        timeZone,
        now,
        now,
        now
      )
    );

    return { submittedAt: now };
  }
}
