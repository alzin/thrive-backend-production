export interface Booking {
  id: string;
  userId: string;
  sessionId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingRepository {
  create(booking: Booking): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findByUserId(userId: string): Promise<Booking[]>;
  findBySessionId(sessionId: string): Promise<Booking[]>;
  findActiveByUserId(userId: string): Promise<Booking[]>;
  update(booking: Booking): Promise<Booking>;
  cancel(id: string): Promise<boolean>;
}