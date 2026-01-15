import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/login';
const HOME_PATH = '/';
const PROTECTED_PREFIXED = ['/posts/write', '/posts/[0-9]+/edit', '/me'];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXED.some((p) => {
    // 정규식 패턴 지원
    if (p.includes('[0-9]+')) {
      const regex = new RegExp('^' + p.replace('[0-9]+', '\\d+') + '(/.*)?$');
      return regex.test(pathname);
    }
    return pathname.startsWith(p);
  });
}

export function proxy(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  const hasAT = Boolean(cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const hasRT = Boolean(cookies.get(REFRESH_TOKEN_COOKIE)?.value);

  if (isProtected(pathname) && !hasAT) {
    // RT 있으면: 로그인 페이지로 이동 (클라이언트에서 자동 리프레시 시도)
    if (hasRT) {
      const url = new URL(LOGIN_PATH, req.url);
      url.searchParams.set('from', nextUrl.pathname + nextUrl.search);
      url.searchParams.set('retry', '1'); // 리프레시 시도 플래그
      return NextResponse.redirect(url);
    }

    // RT도 없으면: 로그인
    const url = new URL(LOGIN_PATH, req.url);
    url.searchParams.set('from', nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (pathname === LOGIN_PATH && hasAT) {
    const from = nextUrl.searchParams.get('from');
    const dest = from && from.startsWith('/') ? from : HOME_PATH;
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/posts/write/:path*', '/posts/:id/edit', '/login', '/me'],
};
