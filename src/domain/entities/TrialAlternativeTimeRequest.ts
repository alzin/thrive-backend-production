export interface ITrialAlternativeTimeRequest {
  id: string;
  userId: string;
  preferredTimes: string[];
  timeZone: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TrialAlternativeTimeRequest implements ITrialAlternativeTimeRequest {
  constructor(
    public id: string,
    public userId: string,
    public preferredTimes: string[],
    public timeZone: string,
    public submittedAt: Date,
    public createdAt: Date,
    public updatedAt: Date
  ) { }
}
