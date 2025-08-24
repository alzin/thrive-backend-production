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
  isverify: boolean;  // New field
  verificationCode: string | null
  exprirat: Date | null;  // New field
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
    public isverify: boolean,  // New field
    public verificationCode: string | null,
    public exprirat: Date | null,  // New field
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