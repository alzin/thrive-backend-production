import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from './User.entity';
import { ActivityType } from '../../../domain/entities/RecentActivity';

@Entity('recent_activities')
@Index(['userId', 'createdAt'])
@Index(['createdAt'])
export class RecentActivityEntity {
    @PrimaryColumn()
    id!: string;

    @Column()
    userId!: string;

    @ManyToOne(() => UserEntity, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Column({
        type: 'enum',
        enum: ActivityType
    })
    activityType!: ActivityType;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata!: Record<string, any> | null;

    @CreateDateColumn()
    createdAt!: Date;
}