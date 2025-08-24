// backend/src/application/use-cases/auth/VerifyEmailUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../services/ITokenService';
import { RefreshToken } from '../../../domain/entities/RefreshToken';

export interface VerifyEmailDTO {
    email: string;
    code: string;
}

export class VerifyEmailUseCase {
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
            csrfToken
        };
    }
}