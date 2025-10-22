import { ACCESS_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // 백엔드 로그아웃 호출(Refresh 삭제 + Access 블랙리스트)
  const res = await fetch(`${SERVER_BASE_URL}/auth/logout`, {
    method: 'POST',
    cache: 'no-store',
    // BFF(서버) → 백엔드 요청이라 credentials 옵션 불필요
    // Authorization 헤더가 필요하면 withAuth 유틸 사용
  });

  // 프론트 Access 쿠키 제거
  const c = cookies();
  c.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);

  const setCookieHeader = res.headers.get('set-cookie');
  const response = NextResponse.json({ ok: res.ok });
  if (setCookieHeader) response.headers.set('set-cookie', setCookieHeader);
  return response;
}
