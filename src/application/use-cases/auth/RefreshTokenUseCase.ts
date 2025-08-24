// backend/src/application/use-cases/auth/RefreshTokenUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../services/ITokenService';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { RefreshToken } from '../../../domain/entities/RefreshToken';

export interface RefreshTokenDTO {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    user: {
        id: string;
        email: string;
        role: string;
    };
    csrfToken: string;
}

export class RefreshTokenUseCase {
    constructor(
        private userRepository: IUserRepository,
        private tokenService: ITokenService
    ) { }

    async execute(dto: RefreshTokenDTO): Promise<{ response: RefreshTokenResponse; tokens: { accessToken: string; refreshToken: string } }> {
        // Verify refresh token
        const userId = this.tokenService.verifyRefreshToken(dto.refreshToken);
        if (!userId) {
            throw new AuthenticationError('Invalid refresh token', 403);
        }

        // Get user
        const user = await this.userRepository.findById(userId);
        if (!user || !user.isActive) {
            throw new AuthenticationError('User not found or inactive', 403);
        }

        const tokenPair = this.tokenService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        const csrfToken = this.tokenService.generateCSRFToken();

        return {
            response: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                csrfToken
            },
            tokens: tokenPair
        };
    }
}