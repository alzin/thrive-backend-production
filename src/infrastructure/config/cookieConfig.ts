import { ENV_CONFIG } from "./env.config";

export interface CookieConfig {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
}

export const getAccessTokenCookieConfig = (): CookieConfig => ({
    httpOnly: true,
    secure: ENV_CONFIG.NODE_ENV === 'production',
    sameSite: ENV_CONFIG.NODE_ENV === 'production' ? 'strict' : 'lax'
});

export const getRefreshTokenCookieConfig = (): CookieConfig => ({
    httpOnly: true,
    secure: ENV_CONFIG.NODE_ENV === 'production',
    sameSite: ENV_CONFIG.NODE_ENV === 'production' ? 'strict' : 'lax'
});

export const COOKIE_NAMES = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    CSRF_TOKEN: 'csrf_token',
} as const;