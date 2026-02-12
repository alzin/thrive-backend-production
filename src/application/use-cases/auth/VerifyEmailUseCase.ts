// backend/src/application/use-cases/auth/VerifyEmailUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../../domain/services/ITokenService';
import { ENV_CONFIG } from '../../../infrastructure/config/env.config';

export interface VerifyEmailDTO {
    email: string;
    code: string;
    // Optional: skip trial setup if user is in paid flow
    skipTrialSetup?: boolean;
}

export class VerifyEmailUseCase {
    private readonly FREE_TRIAL_DAYS = ENV_CONFIG.FREE_TRIAL_DAYS;

    constructor(
        private userRepository: IUserRepository,
        private tokenService: ITokenService,
    ) { }

    async execute(dto: VerifyEmailDTO) {
        // Find user by email
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if already verified
        if (user.isverify) {
            throw new Error('Email already verified');
        }

        // Verify the code matches
        if (dto.code !== user.verificationCode) {
            throw new Error('Invalid verification code');
        }

        // Check expiration
        if (user.exprirat && new Date() > user.exprirat) {
            throw new Error('Verification code expired');
        }

        // Update user
        user.verificationCode = null
        user.isverify = true;
        user.exprirat = null; // Clear expiration
        user.updatedAt = new Date();

        // Set up free trial (14 days) if not in paid flow
        // skipTrialSetup is true when user has pre-selected a plan
        if (!dto.skipTrialSetup) {
            const trialStartDate = new Date();
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + this.FREE_TRIAL_DAYS);

            user.trialStartDate = trialStartDate;
            user.trialEndDate = trialEndDate;
            user.trialConvertedToPaid = false;
        }

        await this.userRepository.update(user);

        // Generate new token pair
        const tokenPair = this.tokenService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Generate CSRF token
        const csrfToken = this.tokenService.generateCSRFToken();

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            tokens: tokenPair,
            csrfToken,
            // Return trial info for frontend
            trialInfo: {
                isInFreeTrial: !dto.skipTrialSetup && user.trialStartDate !== null,
                trialEndDate: user.trialEndDate,
            }
        };
    }
}