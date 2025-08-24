// backend/src/infrastructure/services/VerificationCodeService.ts
import { EmailService } from './EmailService';
import { VerificationCodeRepository } from '../database/repositories/VerificationCodeRepository';
import { randomInt } from 'crypto';

export class VerificationCodeService {
    private emailService: EmailService;
    private verificationCodeRepository: VerificationCodeRepository;
    private readonly CODE_EXPIRY_MINUTES = 10;
    private readonly MAX_ATTEMPTS_PER_HOUR = 5;

    constructor() {
        this.emailService = new EmailService();
        this.verificationCodeRepository = new VerificationCodeRepository();
    }

    async generateAndSendCode(email: string): Promise<string> {
        // Check rate limiting
        const recentAttempts = await this.getRecentAttempts(email);
        if (recentAttempts >= this.MAX_ATTEMPTS_PER_HOUR) {
            throw new Error('Too many verification attempts. Please try again later.');
        }

        // Generate 6-digit code
        const code = randomInt(100000, 999999).toString();

        // Store in database
        await this.verificationCodeRepository.create(email, code, this.CODE_EXPIRY_MINUTES);

        // Send email
        await this.emailService.sendVerificationCode(email, code);

        // Optional: Clean up old codes asynchronously
        this.cleanupOldCodes().catch(console.error);

        return code;
    }

    async verifyCode(email: string, code: string): Promise<boolean> {
        const verificationCode = await this.verificationCodeRepository.findValidCode(email, code);

        if (!verificationCode) {
            return false;
        }

        // Mark as verified
        await this.verificationCodeRepository.markAsVerified(verificationCode.id);

        return true;
    }

    async isEmailVerified(email: string, withinMinutes: number = 30): Promise<boolean> {
        return await this.verificationCodeRepository.isEmailRecentlyVerified(email, withinMinutes);
    }

    private async getRecentAttempts(email: string): Promise<number> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // You might want to add a method to count recent attempts in the repository
        // For now, this is a simplified version
        return 0; // Implement actual counting logic
    }

    private async cleanupOldCodes(): Promise<void> {
        try {
            // Delete expired unverified codes
            const expiredDeleted = await this.verificationCodeRepository.deleteExpiredCodes();

            // Delete old verified codes (older than 30 days)
            const oldVerifiedDeleted = await this.verificationCodeRepository.deleteOldVerifiedCodes(30);

            if (expiredDeleted > 0 || oldVerifiedDeleted > 0) {
                console.log(`Cleaned up ${expiredDeleted} expired codes and ${oldVerifiedDeleted} old verified codes`);
            }
        } catch (error) {
            console.error('Error cleaning up verification codes:', error);
        }
    }
}

