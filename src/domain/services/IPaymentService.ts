export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface IPaymentService {
  createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string): Promise<boolean>;
  retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null>;
  createCustomer(email: string): Promise<string>;
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
}