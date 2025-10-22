export const ACCESS_TOKEN_COOKIE = 'rp_at';
export const REFRESH_TOKEN_COOKIE = 'RP_REFRESH';

const isProd = process.env.NODE_ENV === 'production';

/** AccessToken 15 minutes */
export const accessTokenCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
  maxAge: 60 * 15, // 15m
};

/** RefreshToken 14 days */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
  maxAge: 60 * 60 * 24 * 14, // 14days
};

/** Token Expired */
export const expiredCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
  maxAge: 0,
};
