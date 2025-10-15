import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_KEY = "routepick-auth";
const SIGN_IN_PATH = "/auth/sign-in";
const PROTECTED_PATHS = ["/planner", "/favorites", "/community"] as const;

const PROTECTED_MATCHERS = PROTECTED_PATHS.map((path) => `${path}/:path*`);

export function middleware(request: NextRequest) {
  const { cookies, nextUrl } = request;

  if (cookies.has(AUTH_COOKIE_KEY)) {
    return NextResponse.next();
  }

  const signInUrl = nextUrl.clone();
  signInUrl.pathname = SIGN_IN_PATH;
  signInUrl.searchParams.set("redirectTo", nextUrl.pathname);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: PROTECTED_MATCHERS,
};
