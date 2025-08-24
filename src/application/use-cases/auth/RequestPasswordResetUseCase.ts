import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEmailService } from '../../services/IEmailService';
import { ITokenService } from '../../services/ITokenService';

export interface RequestPasswordResetDTO {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private tokenService: ITokenService
  ) { }

  async execute(dto: RequestPasswordResetDTO): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new AuthenticationError('User not Found', 400);
    }

    if (!user.isverify) {
      throw new AuthenticationError('Account Not Verified', 400);
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is  inactive', 400);
    }

    // Generate reset token
    const resetToken = this.tokenService.generatePasswordResetToken(user.id, user.email);


    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }
}