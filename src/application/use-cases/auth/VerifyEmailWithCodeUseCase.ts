import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";
import { TokenService } from "../../../infrastructure/services/TokenService";
import { VerifyEmailUseCase } from "./VerifyEmailUseCase";

export class VerifyEmailWithCodeUseCase {
    constructor(
        private userRepository: UserRepository,
        private tokenService: TokenService
    ) { }

    async execute(params: {
        email: string;
        code: string;
    }) {
        const { email, code } = params;

        const verifyEmailUseCase = new VerifyEmailUseCase(
            this.userRepository,
            this.tokenService
        );

        const result = await verifyEmailUseCase.execute({ email, code });

        return result;
    }
}