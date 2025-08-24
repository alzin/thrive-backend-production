import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../services/IPasswordService';
import { ITokenService } from '../../services/ITokenService';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';

export interface ResetPasswordDTO {
    token: string;
    newPassword: string;
}

export class ResetPasswordUseCase {
    constructor(
        private userRepository: IUserRepository,
        private passwordService: IPasswordService,
        private tokenService: ITokenService
    ) { }

    async execute(dto: ResetPasswordDTO): Promise<void> {
        // Verify token
        const payload = this.tokenService.verifyAccessToken(dto.token);
        if (!payload) {
            throw new AuthenticationError('Invalid or expired reset token', 400);
        }

        // Check if user exists
        const user = await this.userRepository.findById(payload.userId);
        if (!user) {
            throw new AuthenticationError('Invalid reset token', 400);
        }

        // Validate password strength
        if (!this.passwordService.validatePasswordStrength(dto.newPassword)) {
            throw new Error('Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character');
        }

        // Hash new password
        const hashedPassword = await this.passwordService.hash(dto.newPassword);

        // Update user password
        user.password = hashedPassword;
        user.updatedAt = new Date();

        await this.userRepository.update(user);
    }
}