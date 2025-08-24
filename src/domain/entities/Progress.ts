export interface IProgress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  isCompleted: boolean;
  completedAt?: Date;
  reflectionSubmitted?: boolean;
  quizScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Progress implements IProgress {
  constructor(
    public id: string,
    public userId: string,
    public lessonId: string,
    public courseId: string,
    public isCompleted: boolean,
    public completedAt: Date | undefined,
    public reflectionSubmitted: boolean | undefined,
    public quizScore: number | undefined,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  markAsCompleted(): void {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
}