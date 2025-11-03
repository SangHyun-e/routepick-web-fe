import { NextResponse } from 'next/server';
import { cookies, headers as nextHeaders } from 'next/headers';
import { SERVER_BASE_URL } from '@/lib/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';

type ParsedCookie = {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
};

function splitSetCookies(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[-A-Za-z0-9!#$%&'*+.^_`|~]+=)/);
}

function parseSetCookie(cookie: string): ParsedCookie | null {
  const [nameValue, ...rest] = cookie.split(';');
  if (!nameValue) return null;
  const [rawName, ...valueParts] = nameValue.split('=');
  if (!rawName) return null;
  const name = rawName.trim();
  const value = valueParts.join('=');

  const parsed: ParsedCookie = {
    name,
    value,
  };

  for (const part of rest) {
    const [rawKey, rawVal] = part.split('=');
    const key = rawKey?.trim().toLowerCase();
    const val = rawVal?.trim();

    switch (key) {
      case 'path':
        parsed.path = val;
        break;
      case 'max-age': {
        const n = Number.parseInt(val ?? '', 10);
        if (Number.isFinite(n)) parsed.maxAge = n;
        break;
      }
      case 'samesite': {
        const lowered = (val ?? '').toLowerCase();
        if (lowered === 'lax' || lowered === 'strict' || lowered === 'none') {
          parsed.sameSite = lowered as ParsedCookie['sameSite'];
        }
        break;
      }
      case 'secure':
        parsed.secure = true;
        break;
      case 'httponly':
        parsed.httpOnly = true;
        break;
      default:
        if (!key && rawKey?.trim().toLowerCase() === 'secure') parsed.secure = true;
        if (!key && rawKey?.trim().toLowerCase() === 'httponly') parsed.httpOnly = true;
        break;
    }
  }

  return parsed;
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

  let resp: NextResponse;
  if (beRes.status === 204 || beRes.status === 205) {
    resp = new NextResponse(null, { status: beRes.status });
  } else {
    resp = NextResponse.json({ ok: beRes.ok }, { status: beRes.status });
  }

  resp.cookies.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);
  resp.cookies.set(REFRESH_TOKEN_COOKIE, '', expiredCookieOptions);

  const backendCookies = splitSetCookies(beRes.headers.get('set-cookie'));
  for (const cookie of backendCookies) {
    const parsed = parseSetCookie(cookie);
    if (!parsed) {
      resp.headers.append('set-cookie', cookie);
      continue;
    }

    if (parsed.name === REFRESH_TOKEN_COOKIE || parsed.name === ACCESS_TOKEN_COOKIE) {
      resp.cookies.set(parsed.name, parsed.value, {
        httpOnly: parsed.httpOnly ?? true,
        sameSite: parsed.sameSite ?? 'lax',
        secure: parsed.secure ?? process.env.NODE_ENV === 'production',
        path: parsed.path ?? '/',
        ...(parsed.maxAge !== undefined ? { maxAge: parsed.maxAge } : {}),
      });
      continue;
    }

    resp.headers.append('set-cookie', cookie);
  }

  resp.headers.set('Cache-Control', 'no-store');

  return resp;
}
