import { Lesson } from '../entities/Lesson';

export interface ILessonRepository {
  create(lesson: Lesson): Promise<Lesson>;
  findById(id: string): Promise<Lesson | null>;
  findByCourseId(courseId: string): Promise<Lesson[]>;
  findByCourseIdAndOrder(courseId: string, order: number): Promise<Lesson | null>;
  update(lesson: Lesson): Promise<Lesson>;
  delete(id: string): Promise<boolean>;
}