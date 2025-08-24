export enum SessionType {
  SPEAKING = 'SPEAKING',
  EVENT = 'EVENT'
}

export interface ISession {
  id: string;
  title: string;
  description: string;
  type: SessionType;
  hostId: string;
  meetingUrl?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  maxParticipants: number;
  currentParticipants: number;
  pointsRequired: number;
  isActive: boolean;
  isRecurring: boolean;
  recurringParentId?: string;
  recurringWeeks?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Session implements ISession {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public type: SessionType,
    public hostId: string,
    public meetingUrl: string | undefined,
    public scheduledAt: Date,
    public duration: number,
    public maxParticipants: number,
    public currentParticipants: number,
    public pointsRequired: number,
    public isActive: boolean,
    public isRecurring: boolean,
    public recurringParentId: string | undefined,
    public recurringWeeks: number | undefined,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  isFull(): boolean {
    return this.currentParticipants >= this.maxParticipants;
  }

  canBook(): boolean {
    return this.isActive && !this.isFull() && this.scheduledAt > new Date();
  }
}
