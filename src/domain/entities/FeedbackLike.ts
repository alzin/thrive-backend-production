export interface IFeedbackLike {
  id: string;
  userId: string;
  feedbackId: string;
  createdAt: Date;
}

export class FeedbackLike implements IFeedbackLike {
  constructor(
    public id: string,
    public userId: string,
    public feedbackId: string,
    public createdAt: Date,
  ) { }
}