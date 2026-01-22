// backend/src/infrastructure/database/repositories/SubscriptionRepository.ts
import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { SubscriptionEntity } from '../entities/Subscription.entity';
import { ISubscriptionRepository } from '../../../domain/repositories/ISubscriptionRepository';
import { Subscription } from '../../../domain/entities/Subscription';

export class SubscriptionRepository implements ISubscriptionRepository {
    private repository: Repository<SubscriptionEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(SubscriptionEntity);
    }

    async create(subscription: Subscription): Promise<Subscription> {
        const entity = this.toEntity(subscription);
        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }

    async findById(id: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toDomain(entity) : null;
    }

    async getAllAcivePayment(): Promise<Subscription[]> {
        const entities = await this.repository.find({
            where: {
                status: In(['active', 'trialing'])
            }
        });
        return entities.map(e => this.toDomain(e));
    }

    // Updated to return single subscription or null (one-to-one)
    async findByUserId(userId: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: { userId }
        });
        return entity ? this.toDomain(entity) : null;
    }

    // Updated to return single subscription or empty array (one-to-one)
    async findActiveByUserId(userId: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: {
                userId,
                status: In(['active', 'trialing'])
            }
        });
        return entity ? this.toDomain(entity) : null;
    }

    async findByTrailingUserId(userId: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: {
                userId,
                status: In(['active', 'trialing'])
            }
        });
        return entity ? this.toDomain(entity) : null;
    }

    async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: { stripeSubscriptionId }
        });
        return entity ? this.toDomain(entity) : null;
    }

    async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: { stripeCustomerId },
            order: { createdAt: 'DESC' }
        });
        return entity ? this.toDomain(entity) : null;
    }

    // NEW METHOD: Find by email
    async findByEmail(email: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: { email }
        });
        return entity ? this.toDomain(entity) : null;
    }

    // NEW METHOD: Upsert - create or update based on userId
    async upsert(subscription: Subscription): Promise<Subscription> {
        const existingEntity = await this.repository.findOne({
            where: { userId: subscription.userId }
        });

        if (existingEntity) {
            // Update existing subscription
            const updatedEntity = this.toEntity(subscription);
            updatedEntity.id = existingEntity.id; // Keep the same ID
            updatedEntity.createdAt = existingEntity.createdAt; // Keep original creation date
            const saved = await this.repository.save(updatedEntity);
            return this.toDomain(saved);
        } else {
            // Create new subscription
            return this.create(subscription);
        }
    }

    async update(subscription: Subscription): Promise<Subscription> {
        const entity = this.toEntity(subscription);
        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }

    async findAll(): Promise<Subscription[]> {
        const entities = await this.repository.find();
        return entities.map(entity => this.toDomain(entity));
    }


    private toDomain(entity: SubscriptionEntity): Subscription {
        return new Subscription(
            entity.id,
            entity.userId,
            entity.email,
            entity.stripeCustomerId,
            entity.stripeSubscriptionId ?? undefined,
            entity.stripePaymentIntentId ?? undefined,
            entity.subscriptionPlan,
            entity.status,
            entity.currentPeriodStart,
            entity.currentPeriodEnd,
            entity.createdAt,
            entity.updatedAt
        );
    }

    private toEntity(subscription: Subscription): SubscriptionEntity {
        const entity = new SubscriptionEntity();
        entity.id = subscription.id;
        entity.userId = subscription.userId;
        entity.email = subscription.email;
        entity.stripeCustomerId = subscription.stripeCustomerId;
        entity.stripeSubscriptionId = subscription.stripeSubscriptionId || null;
        entity.stripePaymentIntentId = subscription.stripePaymentIntentId || null;
        entity.subscriptionPlan = subscription.subscriptionPlan;
        entity.status = subscription.status;
        entity.currentPeriodStart = subscription.currentPeriodStart;
        entity.currentPeriodEnd = subscription.currentPeriodEnd;
        entity.createdAt = subscription.createdAt;
        entity.updatedAt = subscription.updatedAt;
        return entity;
    }
}