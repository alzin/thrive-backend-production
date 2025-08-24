import { Profile } from '../entities/Profile';

export interface IProfileRepository {
  create(profile: Profile): Promise<Profile>;
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  update(profile: Profile): Promise<Profile>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<Profile[]>;
  updatePoints(userId: string, points: number): Promise<Profile | null>;
}
