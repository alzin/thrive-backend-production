// backend/src/infrastructure/database/entities/Subscription.entity.ts
import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    Index,
    Unique
} from 'typeorm';
import { UserEntity } from './User.entity';
import { SubscriptionPlan, SubscriptionStatus } from '../../../domain/entities/Subscription';

@Entity('subscriptions')
@Index(['userId', 'status'])
@Unique(['userId']) // MAKE userId UNIQUE for one-to-one relationship
export class SubscriptionEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ unique: true }) // UNIQUE constraint
    userId!: string;

    @OneToOne(() => UserEntity, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Column() // NEW FIELD
    email!: string;

    @Column()
    stripeCustomerId!: string;

    @Column({ type: 'varchar', nullable: true })
    stripeSubscriptionId!: string | null;

    @Column({ type: 'varchar', nullable: true })
    stripePaymentIntentId!: string | null;

    @Column({
        type: 'enum',
        enum: ['monthly', 'yearly', 'one-time', 'standard', 'premium']
    })
    subscriptionPlan!: SubscriptionPlan;

    @Column({
        type: 'enum',
        enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
        default: 'active'
    })
    status!: SubscriptionStatus;

    @Column({ type: 'timestamp' })
    currentPeriodStart!: Date;

    @Column({ type: 'timestamp' })
    currentPeriodEnd!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}