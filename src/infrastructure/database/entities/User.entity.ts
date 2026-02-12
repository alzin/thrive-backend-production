// backend/src/infrastructure/database/entities/User.entity.ts (UPDATE YOUR EXISTING FILE)
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { UserRole } from '../../../domain/entities/User';

@Entity('users')
export class UserEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isverify!: boolean;

  @Column({ type: 'varchar', nullable: true, default: null })
  verificationCode!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  exprirat!: Date | null;

  @Column({ default: false })
  hasSeedTourVideo!: boolean; // ADD THIS FIELD

  @Column({ default: false })
  marketingEmails!: boolean; // ADD THIS FIELD

  // Free trial fields (no credit card required)
  @Column({ type: 'timestamp', nullable: true, default: null })
  trialStartDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  trialEndDate!: Date | null;

  @Column({ default: false })
  trialConvertedToPaid!: boolean; // Flag to ensure trial_converted_to_paid event fires only once

  @Column({ default: false })
  hasEverPaid!: boolean; // Permanent flag - set to true on first paid transaction (never resets)

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}