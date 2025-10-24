// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies, headers as nextHeaders } from 'next/headers';
import { SERVER_BASE_URL } from '@/lib/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';

export async function POST(req: Request) {
  const c = cookies();

  // Authorization + 클라이언트 쿠키 전달
  const access = c.get(ACCESS_TOKEN_COOKIE)?.value;
  const cookieHeader = req.headers.get('cookie') ?? nextHeaders().get('cookie') ?? '';
  const headers: Record<string, string> = {};
  if (access) headers['Authorization'] = `Bearer ${access}`;
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // 백엔드 로그아웃 호출
  const beRes = await fetch(`${SERVER_BASE_URL}/auth/logout`, {
    method: 'POST',
    cache: 'no-store',
    headers,
    redirect: 'manual',
  });

  // 백엔드가 내려준 Set-Cookie(리프레시 삭제 등) 미리 꺼내둠
  const beSetCookie = beRes.headers.get('set-cookie');

  // 204/205는 바디 없이, 나머지는 JSON으로 응답
  let resp: NextResponse;
  if (beRes.status === 204 || beRes.status === 205) {
    resp = new NextResponse(null, { status: beRes.status });
  } else {
    resp = NextResponse.json({ ok: beRes.ok }, { status: beRes.status });
  }

  // 프론트 도메인에서 Access/Refresh 즉시 제거
  resp.cookies.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);
  resp.cookies.set(REFRESH_TOKEN_COOKIE, '', expiredCookieOptions);

  // 백엔드의 Set-Cookie도 전파(도메인/경로 맞춰 삭제)
  if (beSetCookie) resp.headers.set('set-cookie', beSetCookie);
  resp.headers.set('Cache-Control', 'no-store');

  return resp;
}
