import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { SessionType } from '../../../domain/entities/Session';

@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ type: 'enum', enum: SessionType })
  type!: SessionType;

  @Column()
  hostId!: string;

  @Column({ type: 'varchar', nullable: true })
  meetingUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column()
  scheduledAt!: Date;

  @Column()
  duration!: number;

  @Column()
  maxParticipants!: number;

  @Column({ default: 0 })
  currentParticipants!: number;

  @Column({ default: 0 })
  pointsRequired!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ type: 'varchar', nullable: true })
  recurringParentId!: string | null;

  @Column({ type: 'integer', nullable: true })
  recurringWeeks!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}