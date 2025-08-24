// backend/src/domain/entities/VerificationCode.ts (Optional: Domain model)
export interface VerificationCode {
    id: string;
    email: string;
    code: string;
    verified: boolean;
    verifiedAt: Date | null;
    createdAt: Date;
    expiresAt: Date;
}