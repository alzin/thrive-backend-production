import { Keyword } from '../entities/Keyword';

export interface IKeywordRepository {
  create(keyword: Keyword): Promise<Keyword>;
  createMany(keywords: Keyword[]): Promise<Keyword[]>;
  findById(id: string): Promise<Keyword | null>;
  findByLessonId(lessonId: string): Promise<Keyword[]>;
  update(keyword: Keyword): Promise<Keyword>;
  delete(id: string): Promise<boolean>;
  deleteByLessonId(lessonId: string): Promise<boolean>;
}