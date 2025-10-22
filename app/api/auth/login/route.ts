import { ACCESS_TOKEN_COOKIE, accessTokenCookieOptions } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ message: 'email/password required' }, { status: 400 });
    }

    // 백엔드 로그인 호출
    const res = await fetch(`${SERVER_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 캐시 금지
      cache: 'no-store',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // 백엔드 에러 그대로 전달(가등하면 message만 추려서)
      return NextResponse.json(data ?? { message: 'Login failed' }, { status: res.status });
    }

    // 백엔드 스키마: accessTOken, expiresIn
    const accessToken = typeof data?.accessToken === 'string' ? data.accessToken : null;
    const expiresIn = typeof data?.expiresIn === 'number' ? data.expiresIn : null;

    if (!accessToken) {
      return NextResponse.json({ message: 'Token not found in response' }, { status: 500 });
    }

    // Access Token만 FE 도메인 HttpOnly 쿠키로 저장
    const c = cookies();
    c.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);

    // Refresh Cookie는 백엔드가 Set-Cookie로 내려옴 → 원본 헤더를 그대로 클라이언트로 전달
    const setCookieHeader = res.headers.get('set-cookie');

    const response = NextResponse.json({ ok: true, expiresIn });
    if (setCookieHeader) response.headers.set('set-cookie', setCookieHeader);
    return response;
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
