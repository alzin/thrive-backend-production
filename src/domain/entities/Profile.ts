export interface IProfile {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  profilePhoto?: string;
  languageLevel?: string;
  points: number;
  badges: string[];
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Profile implements IProfile {
  constructor(
    public id: string,
    public userId: string,
    public name: string,
    public bio: string | undefined,
    public profilePhoto: string | undefined,
    public languageLevel: string | undefined,
    public points: number,
    public badges: string[],
    public level: number,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  addPoints(points: number): void {
    this.points += points;
    this.updateLevel();
  }

  removePoints(points: number): void {
    this.points = Math.max(0, this.points - points);
    this.updateLevel();
  }

  private updateLevel(): void {
    // Level calculation based on points
    this.level = Math.floor(this.points / 100) + 1;
  }
}