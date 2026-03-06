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

/** Token Expired */
export const expiredCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
  maxAge: 0,
  expires: new Date(0),
};
