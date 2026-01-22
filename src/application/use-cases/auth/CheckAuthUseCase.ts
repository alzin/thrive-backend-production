import { TokenService } from "../../../infrastructure/services/TokenService";

export class CheckAuthUseCase {
    constructor(
        private tokenService: TokenService
    ) { }

    execute(params: {
        accessToken?: string;
        refreshToken?: string;
    }) {
        const { accessToken, refreshToken } = params;

        if (!refreshToken) {
            return { authenticated: false, status: 403 };
        }

        if (!accessToken) {
            return { authenticated: false, status: 401 };
        }

        const payload = this.tokenService.verifyAccessToken(accessToken);

        if (!payload) {
            return { authenticated: false, status: 401 };
        }

        return {
            authenticated: true,
            user: {
                id: payload.userId,
                email: payload.email,
                role: payload.role
            },
            status: 200
        };
    }
}
