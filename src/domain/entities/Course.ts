// backend/src/domain/entities/Course.ts
export enum CourseType {
  JAPAN_IN_CONTEXT = 'JAPAN_IN_CONTEXT',
  JLPT_IN_CONTEXT = 'JLPT_IN_CONTEXT'
}

export interface ICourse {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  icon: string;
  isActive: boolean;
  freeLessonCount: number;
  order: number; // NEW FIELD
  createdAt: Date;
  updatedAt: Date;
}

export class Course implements ICourse {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public type: CourseType,
    public icon: string,
    public isActive: boolean,
    public freeLessonCount: number,
    public order: number, // NEW FIELD
    public createdAt: Date,
    public updatedAt: Date
  ) { }
}