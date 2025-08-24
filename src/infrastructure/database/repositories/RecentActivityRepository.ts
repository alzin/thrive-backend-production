import { Repository, Between, In, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { RecentActivityEntity } from '../entities/RecentActivity.entity';
import { IRecentActivityRepository, RecentActivityFilters, PaginatedActivities } from '../../../domain/repositories/IRecentActivityRepository';
import { RecentActivity, ActivityType } from '../../../domain/entities/RecentActivity';

export class RecentActivityRepository implements IRecentActivityRepository {
    private repository: Repository<RecentActivityEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(RecentActivityEntity);
    }

    async create(activity: RecentActivity): Promise<RecentActivity> {
        const entity = this.toEntity(activity);
        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }

    async createMany(activities: RecentActivity[]): Promise<RecentActivity[]> {
        const entities = activities.map(a => this.toEntity(a));
        const saved = await this.repository.save(entities);
        return saved.map(e => this.toDomain(e));
    }

    async findById(id: string): Promise<RecentActivity | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toDomain(entity) : null;
    }

    async findByUserId(userId: string, limit: number = 10): Promise<RecentActivity[]> {
        const entities = await this.repository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        return entities.map(e => this.toDomain(e));
    }

    async findWithFilters(
        filters: RecentActivityFilters,
        page: number,
        limit: number
    ): Promise<PaginatedActivities> {
        const queryBuilder = this.repository.createQueryBuilder('activity');

        // Apply filters
        if (filters.userId) {
            queryBuilder.andWhere('activity.userId = :userId', { userId: filters.userId });
        }

        if (filters.activityTypes && filters.activityTypes.length > 0) {
            queryBuilder.andWhere('activity.activityType IN (:...types)', {
                types: filters.activityTypes
            });
        }

        if (filters.startDate && filters.endDate) {
            queryBuilder.andWhere('activity.createdAt BETWEEN :startDate AND :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });
        }

        // Order and pagination
        queryBuilder
            .orderBy('activity.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [entities, total] = await queryBuilder.getManyAndCount();

        return {
            activities: entities.map(e => this.toDomain(e)),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findGlobalRecent(limit: number): Promise<RecentActivity[]> {
        const entities = await this.repository.find({
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['user'],
        });
        return entities.map(e => this.toDomain(e));
    }

    async deleteOlderThan(date: Date): Promise<number> {
        const result = await this.repository.delete({
            createdAt: LessThan(date),
        });
        return result.affected || 0;
    }

    private toDomain(entity: RecentActivityEntity): RecentActivity {
        return new RecentActivity(
            entity.id,
            entity.userId,
            entity.activityType,
            entity.title,
            entity.description || undefined,
            entity.metadata || undefined,
            entity.createdAt
        );
    }

    private toEntity(activity: RecentActivity): RecentActivityEntity {
        const entity = new RecentActivityEntity();
        entity.id = activity.id;
        entity.userId = activity.userId;
        entity.activityType = activity.activityType;
        entity.title = activity.title;
        entity.description = activity.description || null;
        entity.metadata = activity.metadata || null;
        entity.createdAt = activity.createdAt;
        return entity;
    }
}