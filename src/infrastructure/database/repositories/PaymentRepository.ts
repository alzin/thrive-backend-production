import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { PaymentEntity } from '../entities/Payment.entity';
import { IPaymentRepository, Payment } from '../../../domain/repositories/IPaymentRepository';

export class PaymentRepository implements IPaymentRepository {
  private repository: Repository<PaymentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(PaymentEntity);
  }

  async create(payment: Payment): Promise<Payment> {
    const entity = this.toEntity(payment);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByStripePaymentIntentId(id: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { stripePaymentIntentId: id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<Payment[]> {
    let entities: PaymentEntity[];

    if (email && email.trim() !== '') {
      // Find payments for specific email
      entities = await this.repository.find({
        where: { email },
        order: { createdAt: 'DESC' }
      });
    } else {
      // Find all payments when no email provided (for admin analytics)
      entities = await this.repository.find({
        order: { createdAt: 'DESC' }
      });
    }

    return entities.map(e => this.toDomain(e));
  }

  async update(payment: Payment): Promise<Payment> {
    const entity = this.toEntity(payment);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: PaymentEntity): Payment {
    return {
      id: entity.id,
      email: entity.email,
      stripePaymentIntentId: entity.stripePaymentIntentId,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEntity(payment: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.id = payment.id;
    entity.email = payment.email;
    entity.stripePaymentIntentId = payment.stripePaymentIntentId;
    entity.amount = payment.amount;
    entity.currency = payment.currency;
    entity.status = payment.status;
    entity.metadata = payment.metadata;
    entity.createdAt = payment.createdAt;
    entity.updatedAt = payment.updatedAt;
    return entity;
  }
}