// backend/src/domain/entities/RefreshToken.ts
export interface IRefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
}

export class RefreshToken implements IRefreshToken {
    constructor(
        public id: string,
        public userId: string,
        public token: string,
        public expiresAt: Date,
        public createdAt: Date,
        public lastUsedAt?: Date,
        public ipAddress?: string,
        public userAgent?: string
    ) { }

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }
}