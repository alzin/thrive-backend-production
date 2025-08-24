import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository';
import { User, UserRole } from '../../../domain/entities/User';
import { Profile } from '../../../domain/entities/Profile';
import { IEmailService } from '../../services/IEmailService';
import { IPasswordService } from '../../services/IPasswordService';
import { IPaymentService } from '../../services/IPaymentService';

export interface RegisterUserDTO {
  email: string;
  stripePaymentIntentId: string;
}

export interface RegisterUserWithPasswordDTO {
  email: string;
  stripePaymentIntentId: string;
  name: string,
  password: string
}

export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private paymentRepository: IPaymentRepository,
    private emailService: IEmailService,
    private passwordService: IPasswordService,
    private paymentService: IPaymentService
  ) { }

  async execute(dto: RegisterUserDTO): Promise<{ user: User; temporaryPassword: string }> {
    // Verify payment
    // const payment = await this.paymentRepository.findByStripePaymentIntentId(dto.stripePaymentIntentId);
    // if (!payment || payment.status !== 'COMPLETED') {
    //   throw new Error('Payment not found or not completed');
    // }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Generate temporary password
    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const hashedPassword = await this.passwordService.hash(temporaryPassword);

    // Create user
    const user = new User(
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      dto.email,
      hashedPassword,
      UserRole.STUDENT,
      true,
      false,
      null,
      null,
      new Date(),
      new Date()
    );

    const savedUser = await this.userRepository.create(user);

    // Create profile
    // const profile = new Profile(
    //   `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    //   savedUser.id,
    //   dto.email.split('@')[0], // Default name from email
    //   '',
    //   '',
    //   'N5', // Default language level
    //   0, // Starting points
    //   [], // No badges initially
    //   1, // Starting level
    //   new Date(),
    //   new Date()
    // );

    // await this.profileRepository.create(profile);

    // Send welcome email with password
    // await this.emailService.sendWelcomeEmail(dto.email, temporaryPassword);

    return { user: savedUser, temporaryPassword };
  }

  async executeWithPassword(dto: RegisterUserWithPasswordDTO): Promise<{ user: User }> {
    // Verify payment
    // const payment = await this.paymentRepository.findByStripePaymentIntentId(dto.stripePaymentIntentId);
    // if (!payment || payment.status !== 'COMPLETED') {
    //   throw new Error('Payment not found or not completed');
    // }
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