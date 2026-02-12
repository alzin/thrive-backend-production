import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { User, UserRole } from '../../../domain/entities/User';
import { Profile } from '../../../domain/entities/Profile';
import { IEmailService } from '../../../domain/services/IEmailService';
import { IPasswordService } from '../../../domain/services/IPasswordService';
import { IPaymentService } from '../../../domain/services/IPaymentService';

export interface RegisterUserDTO {
  email: string;
  stripePaymentIntentId: string;
  marketingEmails?: boolean;
}

export interface RegisterUserWithPasswordDTO {
  email: string;
  stripePaymentIntentId: string | undefined;
  name: string,
  password: string
}

export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private emailService: IEmailService,
    private passwordService: IPasswordService,
  ) { }

  async execute(dto: RegisterUserDTO): Promise<{ user: User; temporaryPassword: string }> {

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Generate temporary password
    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const hashedPassword = await this.passwordService.hash(temporaryPassword);

    // Generate verification code and expiration date
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10);

    // Create user
    const user = new User(
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      dto.email.trim(),
      hashedPassword,
      UserRole.STUDENT,
      true,
      false, // isverify
      verificationCode,
      expirationDate,
      false, // hasSeedTourVideo
      dto.marketingEmails || false,
      null, // trialStartDate - set on email verification
      null, // trialEndDate - set on email verification
      false, // trialConvertedToPaid
      false,
      new Date(),
      new Date()
    );

    const savedUser = await this.userRepository.create(user);

    return { user: savedUser, temporaryPassword };
  }

  async executeWithPassword(dto: RegisterUserWithPasswordDTO): Promise<{ user: User }> {

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Hash the provided password
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Update the existing user's password
    existingUser.password = hashedPassword;
    existingUser.updatedAt = new Date();

    // Update the user in the database
    await this.userRepository.update(existingUser);

    // Create profile with the provided name
    const profile = new Profile(
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      existingUser.id,
      dto.name,
      '',
      '',
      'N5',
      0,
      [],
      1,
      new Date(),
      new Date()
    );

    await this.profileRepository.create(profile);

    // Send welcome email (without password since user created it)
    await this.emailService.sendWelcomeEmailWithoutPassword(dto.email, dto.name);

    return { user: existingUser };
  }
}