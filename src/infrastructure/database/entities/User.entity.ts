// Add these columns to your existing UserEntity in backend/src/infrastructure/database/entities/User.entity.ts

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
  isverify!: boolean;  // New field

  @Column({ type: 'varchar', nullable: true, default: null })
  verificationCode!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  exprirat!: Date | null;  // New field

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}