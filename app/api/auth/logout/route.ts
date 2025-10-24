import { ACCESS_TOKEN_COOKIE, accessTokenCookieOptions, expiredCookieOptions } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1) 클라이언트가 보낸 Cookie(Refresh 포함) 그대로 전달
  const cookieHeader = req.headers.get('cookie') ?? '';
  const headers: Record<string, string> = {};
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // 2) 백엔드 /auth/refresh 호출
  const beRes = await fetch(`${SERVER_BASE_URL}/auth/refresh`, {
    method: 'POST',
    cache: 'no-store',
    headers,
  });

  const beJson = await beRes.json().catch(() => null);
  // 3) 실패면 프론트 Access 쿠키 비우고, 백엔드의 Set-Cookie(리프레시 폐기/회전) 전파
  if (!beRes.ok) {
    const c = cookies();
    c.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);

    const resp = NextResponse.json(beJson ?? { message: 'Refresh failed' }, {
      status: beRes.status,
    });
    const sc = beRes.headers.get('set-cookie');
    if (sc) resp.headers.set('set-cookie', sc);
    return resp;
  }

  // 4) 성공이면 body에서 accessToken 뽑아 프론트 Access HttpOnly 쿠키로 저장
  const accessToken = beJson?.accessToken ?? beJson?.token ?? beJson?.data?.accessToken ?? null;

  if (!accessToken || typeof accessToken !== 'string') {
    return NextResponse.json({ message: 'No access token in refresh response' }, { status: 500 });
  }

  const c = cookies();
  c.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);

  // 5) 백엔드가 내려준 Refresh 회전(Set-Cookie) 있으면 그대로 전파
  const resp = NextResponse.json({
    ok: true,
    expiresIn: beJson?.expiresIn ?? undefined,
  });
  const sc = beRes.headers.get('set-cookie');
  if (sc) resp.headers.set('set-cookie', sc);
  return resp;
}
