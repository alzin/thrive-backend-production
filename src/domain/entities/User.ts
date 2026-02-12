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
  hasSeedTourVideo: boolean;
  marketingEmails: boolean;
  // Free trial fields (no credit card required)
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  trialConvertedToPaid: boolean; // Flag to ensure trial_converted_to_paid event fires only once
  hasEverPaid: boolean; // Permanent flag - set to true on first paid transaction (never resets)
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
    public hasSeedTourVideo: boolean,
    public marketingEmails: boolean,
    // Free trial fields (no credit card required)
    public trialStartDate: Date | null,
    public trialEndDate: Date | null,
    public trialConvertedToPaid: boolean,
    public hasEverPaid: boolean,
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