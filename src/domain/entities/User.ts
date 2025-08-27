// backend/src/domain/entities/User.ts (UPDATE YOUR EXISTING FILE)
export enum UserRole {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT'
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isverify: boolean;
  verificationCode: string | null;
  exprirat: Date | null;
  hasSeedTourVideo: boolean; // ADD THIS FIELD
  createdAt: Date;
  updatedAt: Date;
}

export class User implements IUser {
  constructor(
    public id: string,
    public email: string,
    public password: string,
    public role: UserRole,
    public isActive: boolean,
    public isverify: boolean,
    public verificationCode: string | null,
    public exprirat: Date | null,
    public hasSeedTourVideo: boolean, // ADD THIS FIELD
    public createdAt: Date,
    public updatedAt: Date
  ) { }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isInstructor(): boolean {
    return this.role === UserRole.INSTRUCTOR;
  }

  isStudent(): boolean {
    return this.role === UserRole.STUDENT;
  }
}