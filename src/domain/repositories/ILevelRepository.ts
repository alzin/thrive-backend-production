import { Level } from '../entities/Level';

export interface ILevelRepository {
  create(level: Level): Promise<Level>;
  findById(id: string): Promise<Level | null>;
  findAll(): Promise<Level[]>;
  update(level: Level): Promise<Level>;
  delete(id: string): Promise<boolean>;
}
