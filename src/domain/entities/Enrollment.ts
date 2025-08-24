// backend/src/domain/entities/Enrollment.ts
export interface IEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Enrollment implements IEnrollment {
  constructor(
    public id: string,
    public userId: string,
    public courseId: string,
    public enrolledAt: Date,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}