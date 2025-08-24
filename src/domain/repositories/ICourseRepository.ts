import { Course } from '../entities/Course';

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findAll(isActive?: boolean): Promise<Course[]>;
  update(course: Course): Promise<Course>;
  delete(id: string): Promise<boolean>;
}