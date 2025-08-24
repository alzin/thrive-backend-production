import { Progress } from '../entities/Progress';

export interface IProgressRepository {
  create(progress: Progress): Promise<Progress>;
  findById(id: string): Promise<Progress | null>;
  findByUserAndLesson(userId: string, lessonId: string): Promise<Progress | null>;
  findByUserAndCourse(userId: string, courseId: string): Promise<Progress[]>;
  update(progress: Progress): Promise<Progress>;
  getCompletedLessonCount(userId: string, courseId: string): Promise<number>;
}