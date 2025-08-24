import { Repository, MoreThan, Between } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { SessionEntity } from '../entities/Session.entity';
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { Session } from '../../../domain/entities/Session';

interface PaginationOptions {
  offset: number;
  limit: number;
  filters?: {
    type?: 'SPEAKING' | 'EVENT';
    isActive?: boolean;
    isRecurring?: boolean;
  };
}

interface PaginatedResult {
  sessions: Session[];
  total: number;
}

export class SessionRepository implements ISessionRepository {
  private repository: Repository<SessionEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SessionEntity);
  }

  async create(session: Session): Promise<Session> {
    const entity = this.toEntity(session);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async createMany(sessions: Session[]): Promise<Session[]> {
    const entities = sessions.map(s => this.toEntity(s));
    const saved = await this.repository.save(entities);
    return saved.map(e => this.toDomain(e));
  }

  async findById(id: string): Promise<Session | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findUpcoming(limit?: number): Promise<Session[]> {
    const entities = await this.repository.find({
      where: {
        scheduledAt: MoreThan(new Date()),
        isActive: true
      },
      order: { scheduledAt: 'ASC' },
      take: limit,
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    const entities = await this.repository.find({
      where: {
        scheduledAt: Between(startDate, endDate),
        isActive: true
      },
      order: { scheduledAt: 'ASC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAllWithPagination(options: PaginationOptions): Promise<PaginatedResult> {
    const queryBuilder = this.repository.createQueryBuilder('session');

    // Apply filters
    if (options.filters?.type) {
      queryBuilder.andWhere('session.type = :type', { type: options.filters.type });
    }

    if (options.filters?.isActive !== undefined) {
      queryBuilder.andWhere('session.isActive = :isActive', { isActive: options.filters.isActive });
    }

    if (options.filters?.isRecurring !== undefined) {
      queryBuilder.andWhere('session.isRecurring = :isRecurring', { isRecurring: options.filters.isRecurring });
    }

    // Order by scheduled date (most recent first for admin view)
    queryBuilder.orderBy('session.scheduledAt', 'DESC');

    // Apply pagination
    queryBuilder.skip(options.offset).take(options.limit);

    // Get results and count
    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      sessions: entities.map(e => this.toDomain(e)),
      total
    };
  }

  async findByRecurringParentId(parentId: string): Promise<Session[]> {
    const entities = await this.repository.find({
      where: { recurringParentId: parentId },
      order: { scheduledAt: 'ASC' }
    });
    return entities.map(e => this.toDomain(e));
  }

  async update(session: Session): Promise<Session> {
    const entity = this.toEntity(session);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async deleteByRecurringParentId(parentId: string): Promise<boolean> {
    const result = await this.repository.delete({ recurringParentId: parentId });
    return result.affected !== 0;
  }

  // NEW: Delete parent and promote first child to parent
  async deleteParentAndPromoteChild(parentId: string): Promise<{ success: boolean; newParentId?: string; affectedCount: number }> {
    return await AppDataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(SessionEntity);

      // 1. Find the parent session
      const parentSession = await sessionRepo.findOne({ where: { id: parentId } });
      if (!parentSession || !parentSession.isRecurring || parentSession.recurringParentId) {
        throw new Error('Session is not a recurring parent session');
      }

      // 2. Find all child sessions ordered by scheduledAt
      const childSessions = await sessionRepo.find({
        where: { recurringParentId: parentId },
        order: { scheduledAt: 'ASC' }
      });

      if (childSessions.length === 0) {
        // No children, just delete the parent
        await sessionRepo.delete(parentId);
        return { success: true, affectedCount: 1 };
      }

      // 3. Get the first child (earliest scheduled)
      const newParent = childSessions[0];
      const remainingChildren = childSessions.slice(1);

      // 4. Promote the first child to parent
      newParent.recurringParentId = null; // Remove parent reference
      newParent.recurringWeeks = parentSession.recurringWeeks; // Inherit parent properties
      await sessionRepo.save(newParent);

      // 5. Update remaining children to point to new parent
      if (remainingChildren.length > 0) {
        await sessionRepo.update(
          { id: remainingChildren.map(s => s.id) as any },
          { recurringParentId: newParent.id }
        );
      }

      // 6. Delete the original parent
      await sessionRepo.delete(parentId);

      return {
        success: true,
        newParentId: newParent.id,
        affectedCount: 1 + remainingChildren.length // Parent deleted + children updated
      };
    });
  }

  // NEW: Check if session is a recurring parent
  async isRecurringParent(sessionId: string): Promise<boolean> {
    const session = await this.repository.findOne({ where: { id: sessionId } });
    return !!(session?.isRecurring && !session.recurringParentId);
  }

  // NEW: Get recurring series info
  async getRecurringSeriesInfo(sessionId: string): Promise<{
    isRecurring: boolean;
    isParent: boolean;
    parentId?: string;
    childrenCount: number;
    totalInSeries: number;
  }> {
    const session = await this.repository.findOne({ where: { id: sessionId } });
    
    if (!session?.isRecurring) {
      return {
        isRecurring: false,
        isParent: false,
        childrenCount: 0,
        totalInSeries: 1
      };
    }

    const isParent = !session.recurringParentId;
    const parentId = isParent ? sessionId : session.recurringParentId!;
    
    const childrenCount = await this.repository.count({
      where: { recurringParentId: parentId }
    });

    return {
      isRecurring: true,
      isParent,
      parentId: isParent ? undefined : parentId,
      childrenCount,
      totalInSeries: childrenCount + 1 // Include parent
    };
  }

  async incrementParticipants(id: string): Promise<Session | null> {
    await this.repository.increment({ id }, 'currentParticipants', 1);
    return this.findById(id);
  }

  async decrementParticipants(id: string): Promise<Session | null> {
    await this.repository.decrement({ id }, 'currentParticipants', 1);
    return this.findById(id);
  }

  async findByMonth(year: number, month: number): Promise<Session[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.findByDateRange(startDate, endDate);
  }

  async findByWeek(startOfWeek: Date): Promise<Session[]> {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfWeek, endOfWeek);
  }

  async countByDay(date: Date): Promise<number> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    return await this.repository.count({
      where: {
        scheduledAt: Between(startOfDay, endOfDay),
        isActive: true,
      },
    });
  }

  private toDomain(entity: SessionEntity): Session {
    return new Session(
      entity.id,
      entity.title,
      entity.description,
      entity.type,
      entity.hostId,
      entity.meetingUrl ?? undefined,
      entity.scheduledAt,
      entity.duration,
      entity.maxParticipants,
      entity.currentParticipants,
      entity.pointsRequired,
      entity.isActive,
      entity.isRecurring,
      entity.recurringParentId ?? undefined,
      entity.recurringWeeks ?? undefined,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(session: Session): SessionEntity {
    const entity = new SessionEntity();
    entity.id = session.id;
    entity.title = session.title;
    entity.description = session.description;
    entity.type = session.type;
    entity.hostId = session.hostId;
    entity.meetingUrl = session.meetingUrl || null;
    entity.scheduledAt = session.scheduledAt;
    entity.duration = session.duration;
    entity.maxParticipants = session.maxParticipants;
    entity.currentParticipants = session.currentParticipants;
    entity.pointsRequired = session.pointsRequired;
    entity.isActive = session.isActive;
    entity.isRecurring = session.isRecurring;
    entity.recurringParentId = session.recurringParentId || null;
    entity.recurringWeeks = session.recurringWeeks || null;
    entity.createdAt = session.createdAt;
    entity.updatedAt = session.updatedAt;
    return entity;
  }
}