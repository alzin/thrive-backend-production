// backend/src/application/use-cases/auth/RegisterWithVerificationUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../../domain/entities/User';
import { IPasswordService } from '../../services/IPasswordService';
import { IEmailService } from '../../services/IEmailService';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { Profile } from '../../../domain/entities/Profile';

export interface RegisterWithVerificationDTO {
    name: string;
    email: string;
    password: string;
}

export class RegisterWithVerificationUseCase {
    constructor(
        private userRepository: IUserRepository,
        private passwordService: IPasswordService,
        private emailService: IEmailService,
        private profileRepository: IProfileRepository,

    ) { }

    async execute(dto: RegisterWithVerificationDTO): Promise<{ user: User; verificationCode: string }> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(dto.email);

        if (existingUser) {
            if (existingUser.isverify) {
                throw new Error('User already exists');
            }

            // User exists but not verified - update the existing user
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expirationDate = new Date();
            expirationDate.setMinutes(expirationDate.getMinutes() + 10);

            // Update the existing user with new verification code and expiration
            existingUser.password = await this.passwordService.hash(dto.password);
            existingUser.verificationCode = verificationCode;
            existingUser.exprirat = expirationDate;
            existingUser.updatedAt = new Date();

            const updatedUser = await this.userRepository.update(existingUser);

            // Send verification email
            await this.emailService.sendVerificationCode(dto.email, verificationCode);

            return { user: updatedUser, verificationCode };
        }

        // Hash password for new user
        const hashedPassword = await this.passwordService.hash(dto.password);

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 10);

        // Create new user with isverify = false
        const user = new User(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            dto.email,
            hashedPassword,
            UserRole.STUDENT,
            true,
            false, // isverify
            verificationCode,
            expirationDate,
            new Date(),
            new Date()
        );

        const savedUser = await this.userRepository.create(user);


        const profile = new Profile(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            savedUser.id,
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

        // Send verification email
        await this.emailService.sendVerificationCode(dto.email, verificationCode);

        return { user: savedUser, verificationCode };
    }
}