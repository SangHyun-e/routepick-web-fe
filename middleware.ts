import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/login';
const HOME_PATH = '/';
const PROTECTED_PREFIXED = ['/me', '/posts/write'];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXED.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // 쿠키에 액세스토큰 있는지 확인
  const hasAT = !!cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasRT = !!cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const authed = hasAT && hasRT;
  // 1) 보호 경로인데 비로그인 → /login?from=...
  if (isProtected(pathname) && !authed) {
    const url = new URL(LOGIN_PATH, req.url);
    url.searchParams.set('from', nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 2) 로그인 상태에서 /login 접근 → from 또는 홈으로
  if (pathname === LOGIN_PATH && authed) {
    const from = nextUrl.searchParams.get('from');
    const dest = from && from.startsWith('/') ? from : HOME_PATH;
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // 통과
  return NextResponse.next();
}
//
export const config = {
  matcher: ['/me', '/posts/write', '/login'],
};
