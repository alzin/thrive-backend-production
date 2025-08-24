// backend/src/domain/repositories/ISubscriptionRepository.ts
import { Subscription } from '../entities/Subscription';

export interface ISubscriptionRepository {
    create(subscription: Subscription): Promise<Subscription>;
    findById(id: string): Promise<Subscription | null>;
    findByUserId(userId: string): Promise<Subscription | null>;
    findActiveByUserId(userId: string): Promise<Subscription | null>;
    findByTrailingUserId(userId: string): Promise<Subscription | null>;
    findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;
    findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null>;
    findByEmail(email: string): Promise<Subscription | null>;
    upsert(subscription: Subscription): Promise<Subscription>;
    update(subscription: Subscription): Promise<Subscription>;
    delete(id: string): Promise<boolean>;
    getAllAcivePayment(): Promise<Subscription[]>; // For discount counting
}