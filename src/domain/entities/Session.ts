export enum SessionType {
  SPEAKING = 'SPEAKING',
  EVENT = 'EVENT',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM'
}

export interface ISession {
  id: string;
  title: string;
  description: string;
  type: SessionType;
  hostId: string;
  meetingUrl?: string;
  location? :string;
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
    public location: string | undefined,
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
  ) { }

  isFull(): boolean {
    return this.currentParticipants >= this.maxParticipants;
  }

  canBook(): boolean {
    const sessionStartTime = this.scheduledAt;
    const sessionEndTime = new Date(sessionStartTime.getTime() + this.duration * 60000);
    const isPast = sessionEndTime < new Date();

    return this.isActive && !this.isFull() && !isPast;
  }
}
