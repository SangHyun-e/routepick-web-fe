import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';

export type AuthState = {
  isAuthenticated: boolean;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
};

export async function getAuthState(): Promise<AuthState> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  return {
    isAuthenticated: Boolean(accessToken),
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
  };
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}
