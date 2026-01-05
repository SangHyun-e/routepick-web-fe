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
    const { email, password } = body as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ message: 'email/password required' }, { status: 400 });
    }

    // 1) BE 로그인 호출
    const beRes = await fetch(`${SERVER_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ email, password }),
      redirect: 'manual',
    });

    const text = await beRes.text();
    // 실패면 BE의 Set-Cookie(실패 케이스에도 있을 수 있음)까지 그대로 전달
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

    // 2) 성공: access / expires 파싱 (키 이름 다양성 대응)
    const { access, expiresInSec } = parseAccessTokenPayload(text);

    if (!access) {
      const resp = NextResponse.json({ message: 'Token not found in response' }, { status: 500 });
      // BE가 내려준 쿠키는 그대로 전달(디버깅/호환)
      appendSetCookies(resp, beRes);
      return resp;
    }

    // 3) 최종 응답 생성
    const ok = new NextResponse(text, {
      status: 200,
      headers: { 'content-type': beRes.headers.get('content-type') ?? 'application/json' },
    });

    // 4) 토큰 쿠키는 직접 심고, 나머지 Set-Cookie는 그대로 전달
    const refresh = readRefreshCookie(beRes);
    applyAuthCookies(ok, { access, expiresInSec, refresh: refresh ?? undefined });
    appendSetCookies(ok, beRes, new Set([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]));

    return ok;
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
