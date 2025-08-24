export interface Payment {
  id: string;
  email: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByStripePaymentIntentId(id: string): Promise<Payment | null>;
  findByEmail(email: string): Promise<Payment[]>;
  update(payment: Payment): Promise<Payment>;
}