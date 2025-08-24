// backend/src/infrastructure/repositories/VerificationCodeRepository.ts
import { Repository } from 'typeorm';
import { VerificationCodeEntity } from '../entities/VerificationCode.entity';
import { AppDataSource } from '../config/database.config';

export class VerificationCodeRepository {
    private repository: Repository<VerificationCodeEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(VerificationCodeEntity);
    }

    async create(email: string, code: string, expiryMinutes: number): Promise<VerificationCodeEntity> {
        const verificationCode = this.repository.create({
            email,
            code,
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        });

        return await this.repository.save(verificationCode);
    }

    async findLatestByEmail(email: string): Promise<VerificationCodeEntity | null> {
        return await this.repository.findOne({
            where: { email },
            order: { createdAt: 'DESC' },
        });
    }

    async findValidCode(email: string, code: string): Promise<VerificationCodeEntity | null> {
        const now = new Date();

        const latestCode = await this.repository
            .createQueryBuilder('vc')
            .where('vc.email = :email', { email })
            .andWhere('vc.expiresAt > :now', { now })
            .andWhere('vc.verified = false')
            .orderBy('vc.createdAt', 'DESC')
            .getOne();

        if (!latestCode || latestCode.code !== code) {
            return null;
        }

        return latestCode;
    }

    async markAsVerified(id: string): Promise<void> {
        await this.repository.update(id, {
            verified: true,
            verifiedAt: new Date(),
        });
    }

    async isEmailRecentlyVerified(email: string, withinMinutes: number = 30): Promise<boolean> {
        const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);

        const verifiedCode = await this.repository
            .createQueryBuilder('vc')
            .where('vc.email = :email', { email })
            .andWhere('vc.verified = true')
            .andWhere('vc.verifiedAt > :cutoffTime', { cutoffTime })
            .getOne();

        return !!verifiedCode;
    }

    async deleteExpiredCodes(): Promise<number> {
        const now = new Date();

        const result = await this.repository
            .createQueryBuilder()
            .delete()
            .where('expiresAt < :now', { now })
            .execute();

        return result.affected || 0;
    }

    async deleteOldVerifiedCodes(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

        const result = await this.repository
            .createQueryBuilder()
            .delete()
            .where('verified = true')
            .andWhere('verifiedAt < :cutoffDate', { cutoffDate })
            .execute();

        return result.affected || 0;
    }
}