// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies, headers as nextHeaders } from 'next/headers';
import { SERVER_BASE_URL } from '@/lib/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';

function splitSetCookies(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[-A-Za-z0-9!#$%&'*+.^_`|~]+=)/);
}

export async function POST(req: Request) {
  const c = cookies();

  const access = c.get(ACCESS_TOKEN_COOKIE)?.value;
  const cookieHeader = req.headers.get('cookie') ?? nextHeaders().get('cookie') ?? '';
  const headers: Record<string, string> = {};
  if (access) headers['Authorization'] = `Bearer ${access}`;
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  const beRes = await fetch(`${SERVER_BASE_URL}/auth/logout`, {
    method: 'POST',
    cache: 'no-store',
    headers,
    redirect: 'manual',
  });

  const backendCookies = splitSetCookies(beRes.headers.get('set-cookie'));

  let resp: NextResponse;
  if (beRes.status === 204 || beRes.status === 205) {
    resp = new NextResponse(null, { status: beRes.status });
  } else {
    resp = NextResponse.json({ ok: beRes.ok }, { status: beRes.status });
  }

  resp.cookies.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);
  resp.cookies.set(REFRESH_TOKEN_COOKIE, '', expiredCookieOptions);

  for (const cookie of backendCookies) {
    resp.headers.append('set-cookie', cookie);
  }

  resp.headers.set('Cache-Control', 'no-store');

  return resp;
}
