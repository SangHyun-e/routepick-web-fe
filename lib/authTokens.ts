import { NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  expiredCookieOptions,
} from '@/lib/cookies';
import { parseSetCookie, splitSetCookies } from '@/lib/httpCookies';

export type RefreshCookie = {
  value: string;
  maxAge?: number;
};

export type AccessPayload = {
  access?: string;
  expiresInSec?: number;
};

export function parseAccessTokenPayload(text: string): AccessPayload {
  try {
    const json = JSON.parse(text);
    const access = json?.access ?? json?.accessToken ?? json?.token ?? undefined;
    const expiresInSec = json?.expiresInSec ?? json?.expiresIn;
    return {
      access: typeof access === 'string' && access.length > 0 ? access : undefined,
      expiresInSec: typeof expiresInSec === 'number' ? expiresInSec : undefined,
    };
  } catch {
    return {};
  }
}

export function readRefreshCookie(res: Response): RefreshCookie | null {
  for (const sc of splitSetCookies(res)) {
    const parsed = parseSetCookie(sc);
    if (!parsed) continue;
    if (parsed.name !== REFRESH_TOKEN_COOKIE) continue;
    return { value: parsed.value, maxAge: parsed.maxAge };
  }
  return null;
}

export function applyAuthCookies(
  res: NextResponse,
  payload: { access?: string; expiresInSec?: number; refresh?: RefreshCookie },
) {
  if (payload.refresh) {
    res.cookies.set(REFRESH_TOKEN_COOKIE, payload.refresh.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(payload.refresh.maxAge !== undefined ? { maxAge: payload.refresh.maxAge } : {}),
    });
  }

  if (payload.access) {
    res.cookies.set(ACCESS_TOKEN_COOKIE, payload.access, {
      ...accessTokenCookieOptions,
      ...(typeof payload.expiresInSec === 'number' ? { maxAge: payload.expiresInSec } : {}),
    });
  }
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);
  res.cookies.set(REFRESH_TOKEN_COOKIE, '', expiredCookieOptions);
}

export function appendSetCookies(
  res: NextResponse,
  source: Response,
  excludeNames: Set<string> = new Set(),
) {
  for (const raw of splitSetCookies(source)) {
    const parsed = parseSetCookie(raw);
    if (parsed && excludeNames.has(parsed.name)) continue;
    res.headers.append('set-cookie', raw);
  }
}
