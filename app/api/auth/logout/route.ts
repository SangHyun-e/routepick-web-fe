import { ACCESS_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const c = cookies();
  // 1) Authorization 헤더용 Access
  const access = c.get(ACCESS_TOKEN_COOKIE)?.value;

  // 2) 클라이언트가 보낸 Cookies 헤더(Refresh 포함) 전달
  const cookieHeader = req.headers.get('cookie') ?? '';
  const headers: Record<string, string> = {};
  if (access) headers['Authorization'] = `Bearer ${access}`;
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // 3) 백엔드 로그아웃 호출 (BL 등록 + Refresh 폐기)
  const res = await fetch(`${SERVER_BASE_URL}/auth/logout`, {
    method: 'POST',
    cache: 'no-store',
    headers,
    redirect: 'manual',
  });

  // 4) 프론트 Access 쿠키 제거
  c.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);

  // 5) 백엔드가 내려준 Refresh 삭제 Set-Cookies 전달
  const setCookieHeader = res.headers.get('set-cookie');
  const response = NextResponse.json({ ok: res.ok });
  if (setCookieHeader) response.headers.set('set-cookie', setCookieHeader);
  return response;
}
