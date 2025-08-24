// backend/src/application/use-cases/auth/ResendVerificationCodeUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEmailService } from '../../services/IEmailService';

export interface ResendVerificationCodeDTO {
    email: string;
}

export class ResendVerificationCodeUseCase {
    constructor(
        private userRepository: IUserRepository,
        private emailService: IEmailService
    ) { }

    async execute(dto: ResendVerificationCodeDTO): Promise<{ verificationCode: string }> {
        // Find user by email
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if already verified
        if (user.isverify) {
            throw new Error('Email already verified');
        }

        // Generate new 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Update expiration
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 10); // 10 minutes expiration
        user.verificationCode = verificationCode
        user.exprirat = expirationDate;
        user.updatedAt = new Date();

        await this.userRepository.update(user);

        // Send verification email
        await this.emailService.sendVerificationCode(dto.email, verificationCode);

        return { verificationCode };
    }
}