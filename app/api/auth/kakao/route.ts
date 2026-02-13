import { NextResponse } from 'next/server';
import { SERVER_BASE_URL } from '@/lib/env';
import {
  appendSetCookies,
  applyAuthCookies,
  parseAccessTokenPayload,
  readRefreshCookie,
} from '@/lib/authTokens';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code } = body as { code?: string };
    if (!code) {
      return NextResponse.json({ message: 'code required' }, { status: 400 });
    }

    const beRes = await fetch(`${SERVER_BASE_URL}/auth/oauth/kakao/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ code }),
      redirect: 'manual',
    });

    const text = await beRes.text();
    if (!beRes.ok) {
      const fail = new NextResponse(text, {
        status: beRes.status,
        headers: {
          'content-type': beRes.headers.get('content-type') ?? 'application/json',
        },
      });
      appendSetCookies(fail, beRes);
      return fail;
    }

    const { access, expiresInSec } = parseAccessTokenPayload(text);
    if (!access) {
      const resp = NextResponse.json({ message: 'Token not found in response' }, { status: 500 });
      appendSetCookies(resp, beRes);
      return resp;
    }

    const ok = new NextResponse(text, {
      status: 200,
      headers: { 'content-type': beRes.headers.get('content-type') ?? 'application/json' },
    });

    const refresh = readRefreshCookie(beRes);
    applyAuthCookies(ok, { access, expiresInSec, refresh: refresh ?? undefined });
    appendSetCookies(ok, beRes, new Set([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]));

    return ok;
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
