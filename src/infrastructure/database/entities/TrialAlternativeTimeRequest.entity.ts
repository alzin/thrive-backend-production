import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User.entity';

@Entity('trial_alternative_time_requests')
export class TrialAlternativeTimeRequestEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'jsonb' })
  preferredTimes!: string[];

  @Column({ type: 'varchar' })
  timeZone!: string;

  @Column({ type: 'timestamp' })
  submittedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
