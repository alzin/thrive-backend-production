// backend/src/infrastructure/persistence/entities/VerificationCodeEntity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('verification_codes')
@Index(['email', 'createdAt'])
export class VerificationCodeEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    @Index()
    email!: string;

    @Column({ length: 6 })
    code!: string;

    @Column({ default: false })
    verified!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: 'timestamp' })
    expiresAt!: Date;
}
