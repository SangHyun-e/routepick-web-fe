import { ACCESS_TOKEN_COOKIE, accessTokenCookieOptions } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const res = await fetch(`${SERVER_BASE_URL}/auth/refresh`, {
    method: 'POST',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok)
    return NextResponse.json(data ?? { message: 'refresh failed' }, { status: res.status });

  const accessToken = typeof data?.accessToken === 'string' ? data.accessToken : null;
  const expiresIn = typeof data?.expiresIn === 'number' ? data.expiresIn : null;
  if (!accessToken) return NextResponse.json({ message: 'Token not found' }, { status: 500 });

  const c = cookies();
  c.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);

  const setCookieHeader = res.headers.get('set-cookies');
  const response = NextResponse.json({ ok: true, expiresIn });
  if (setCookieHeader) response.headers.set('set-cookie', setCookieHeader);
  return response;
}
