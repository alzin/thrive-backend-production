export interface MeetingDetails {
  meetingUrl: string;
  meetingId: string;
  password?: string;
  startUrl: string;
}

export interface IMeetingService {
  createMeeting(
    topic: string,
    startTime: Date,
    duration: number,
    hostEmail: string
  ): Promise<MeetingDetails>;
  updateMeeting(meetingId: string, updates: Partial<MeetingDetails>): Promise<void>;
  deleteMeeting(meetingId: string): Promise<void>;
  getMeetingDetails(meetingId: string): Promise<MeetingDetails | null>;
}
