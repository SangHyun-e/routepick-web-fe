import { ACCESS_TOKEN_COOKIE } from '@/lib/cookies';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/login';
const HOME_PATH = '/';
const PROTECTED_PREFIXED = ['/posts/write']; // 필요한 보호 경로만 관리

function isProtected(pathname: string) {
  return PROTECTED_PREFIXED.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // /me는 항상 통과(페이지 내부에서 401→리프레시 처리)
  if (pathname === '/me') return NextResponse.next();

  const hasAT = !!cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  // 보호 경로: AT 없으면 로그인으로
  if (isProtected(pathname) && !hasAT) {
    const url = new URL(LOGIN_PATH, req.url);
    url.searchParams.set('from', nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 로그인 페이지 접근 시 이미 로그인 상태면 리다이렉트
  if (pathname === LOGIN_PATH && hasAT) {
    const from = nextUrl.searchParams.get('from');
    const dest = from && from.startsWith('/') ? from : HOME_PATH;
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/posts/write', '/login', '/me'],
};
