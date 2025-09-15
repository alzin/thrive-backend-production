import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { BookingEntity } from '../entities/Booking.entity';
import { SessionEntity } from '../entities/Session.entity';
import { IBookingRepository, Booking } from '../../../domain/repositories/IBookingRepository';

export class BookingRepository implements IBookingRepository {
  private repository: Repository<BookingEntity>;
  private sessionRepository: Repository<SessionEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(BookingEntity);
    this.sessionRepository = AppDataSource.getRepository(SessionEntity);
  }

  async create(booking: Booking): Promise<Booking> {
    const entity = this.toEntity(booking);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Booking | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findBySessionId(sessionId: string): Promise<Booking[]> {
    const entities = await this.repository.find({
      where: { sessionId },
    });
    return entities.map(e => this.toDomain(e));
  }

  // FIXED: Only return confirmed bookings for future sessions
  async findActiveByUserId(userId: string): Promise<Booking[]> {
    const currentTime = new Date();

    const entities = await this.repository
      .createQueryBuilder('booking')
      .innerJoin(SessionEntity, 'session', 'session.id = booking.sessionId')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' })
      .andWhere('session.scheduledAt + (session.duration * INTERVAL \'1 minute\') > :currentTime', { currentTime }).orderBy('booking.createdAt', 'DESC')
      .getMany();

    return entities.map(e => this.toDomain(e));
  }

  async update(booking: Booking): Promise<Booking> {
    const entity = this.toEntity(booking);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async cancel(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { status: 'CANCELLED' });
    return result.affected !== 0;
  }

  // NEW: Method to automatically update past session bookings to COMPLETED
  async updatePastBookingsToCompleted(): Promise<number> {
    const currentTime = new Date();

    const result = await this.repository
      .createQueryBuilder('booking')
      .update(BookingEntity)
      .set({ status: 'COMPLETED' })
      .where('booking.status = :confirmedStatus', { confirmedStatus: 'CONFIRMED' })
      .andWhere('booking.sessionId IN ' +
        this.repository
          .createQueryBuilder()
          .subQuery()
          .select('session.id')
          .from(SessionEntity, 'session')
          .andWhere('session.scheduledAt + (session.duration * INTERVAL \'1 minute\') > :currentTime', { currentTime }).orderBy('booking.createdAt', 'DESC')
          .getQuery()
      )
      .execute();

    return result.affected || 0;
  }

  // NEW: Method to get upcoming bookings with session details
  async findUpcomingByUserId(userId: string): Promise<Booking[]> {
    const currentTime = new Date();

    const entities = await this.repository
      .createQueryBuilder('booking')
      .innerJoin(SessionEntity, 'session', 'session.id = booking.sessionId')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' })
      .andWhere('session.scheduledAt + (session.duration * INTERVAL \'1 minute\') > :currentTime', { currentTime }).orderBy('booking.createdAt', 'DESC')
      .orderBy('session.scheduledAt', 'ASC')
      .getMany();

    return entities.map(e => this.toDomain(e));
  }

  private toDomain(entity: BookingEntity): Booking {
    return {
      id: entity.id,
      userId: entity.userId,
      sessionId: entity.sessionId,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEntity(booking: Booking): BookingEntity {
    const entity = new BookingEntity();
    entity.id = booking.id;
    entity.userId = booking.userId;
    entity.sessionId = booking.sessionId;
    entity.status = booking.status;
    entity.createdAt = booking.createdAt;
    entity.updatedAt = booking.updatedAt;
    return entity;
  }
}