import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserRole } from '../../../domain/entities/User';
import { Session, SessionType } from '../../../domain/entities/Session';

export interface CreateRecurringSessionDTO {
  adminId: string;
  title: string;
  description: string;
  type: SessionType;
  hostId?: string;
  meetingUrl?: string;
  scheduledAt: Date;
  duration: number;
  maxParticipants: number;
  pointsRequired: number;
  isActive: boolean;
  recurringWeeks: number; // Number of weeks to repeat
}

export class CreateRecurringSessionUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: CreateRecurringSessionDTO): Promise<Session[]> {
    // Verify admin permissions
    const admin = await this.userRepository.findById(dto.adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }

    if (dto.recurringWeeks < 1 || dto.recurringWeeks > 52) {
      throw new Error('Recurring weeks must be between 1 and 52');
    }

    const sessions: Session[] = [];
    const parentId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Create the parent session (first occurrence)
    const parentSession = new Session(
      parentId,
      dto.title,
      dto.description,
      dto.type,
      dto.hostId || dto.adminId,
      dto.meetingUrl,
      dto.scheduledAt,
      dto.duration,
      dto.maxParticipants,
      0, // currentParticipants
      dto.pointsRequired,
      dto.isActive,
      true, // isRecurring
      undefined, // recurringParentId (parent doesn't have parent)
      dto.recurringWeeks,
      new Date(),
      new Date()
    );

    sessions.push(parentSession);

    // Create recurring sessions
    for (let week = 1; week < dto.recurringWeeks; week++) {
      const recurringDate = new Date(dto.scheduledAt);
      recurringDate.setDate(recurringDate.getDate() + (week * 7));

      const recurringSession = new Session(
        `${Date.now()}-${week}-${Math.random().toString(36).substring(2, 10)}`,
        dto.title,
        dto.description,
        dto.type,
        dto.hostId || dto.adminId,
        dto.meetingUrl,
        recurringDate,
        dto.duration,
        dto.maxParticipants,
        0, // currentParticipants
        dto.pointsRequired,
        dto.isActive,
        true, // isRecurring
        parentId, // recurringParentId
        dto.recurringWeeks,
        new Date(),
        new Date()
      );

      sessions.push(recurringSession);
    }

    // Save all sessions in batch
    const savedSessions = await this.sessionRepository.createMany(sessions);
    return savedSessions;
  }
}