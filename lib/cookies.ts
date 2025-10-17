export const ACCESS_TOKEN_COOKIE = 'rp_at';

export const accessTokenCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7days
};
