import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";
import { TokenService } from "../../../infrastructure/services/TokenService";

export class ValidateResetTokenUseCase {
    constructor(
        private tokenService: TokenService,
        private userRepository: UserRepository
    ) { }

    async execute(params: {
        token: string;
    }) {
        const { token } = params;

        const payload = this.tokenService.verifyAccessToken(token);

        if (!payload) {
            throw new Error('Invalid or expired token');
        }

        const user = await this.userRepository.findById(payload.userId);

        if (!user) {
            throw new Error('Invalid token');
        }

        return {
            valid: true,
            email: user.email
        };
    }
}
