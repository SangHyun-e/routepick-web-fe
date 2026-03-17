import { be } from '@/lib/be';
import {
  appendSetCookies,
  applyAuthCookies,
  clearAuthCookies,
  parseAccessTokenPayload,
  readRefreshCookie,
} from '@/lib/authTokens';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';
import { headers as nextHeaders } from 'next/headers';

const VIEW_TTL_SECONDS = 60 * 60; // 1시간

/** /a//b/ → /a/b 정규화 */
function joinPath(segments: string[]) {
  const p = '/' + (segments ?? []).map((s) => s.replace(/^\/+|\/+$/g, '')).join('/');
  return p === '/' ? '' : p;
}

/** 원요청의 ?query=… 그대로 붙이기 */
function withSearch(path: string, req: NextRequest) {
  const search = new URL(req.url).search;
  return `${path}${search || ''}`;
}

/** hop-by-hop/length 제외하고 나머지 헤더는 다 보존 */
const DROP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'upgrade',
  'content-length',
  'set-cookie',
]);

function passthroughHeaders(src: Response) {
  const h = new Headers();
  src.headers.forEach((v, k) => {
    if (!DROP_HEADERS.has(k.toLowerCase())) h.append(k, v);
  });
  return h;
}

function isNoBodyStatus(status: number) {
  return status === 204 || status === 205 || status === 304;
}

async function readBodySafely(res: Response): Promise<ArrayBuffer | null> {
  if (isNoBodyStatus(res.status)) return null;
  return res.arrayBuffer();
}

/** 조회수 중복 방지 적용 대상: GET /posts/:id */
function shouldApplyViewTracking(pathOnly: string, method: string): boolean {
  return method === 'GET' && /^\/posts\/\d+$/.test(pathOnly);
}

/** /posts/:id 에서 id 추출 */
function extractPostId(pathOnly: string): string | null {
  const match = pathOnly.match(/^\/posts\/(\d+)$/);
  return match ? match[1] : null;
}

/** BE 응답 → 프록시 응답 생성 (Set-Cookie까지 append) */
async function makeProxyResponse(beRes: Response) {
  const final = new NextResponse(await readBodySafely(beRes), {
    status: beRes.status,
    headers: passthroughHeaders(beRes),
  });
  appendSetCookies(final, beRes);
  return final;
}

/** 401 때 1회 refresh (절대 URL + 쿠키 전달) */
async function refreshOnce(): Promise<{
  ok: boolean;
  access?: string;
  expiresInSec?: number;
  rt?: { value: string; maxAge?: number };
}> {
  const h = nextHeaders();
  const reqCookie = h.get('cookie') ?? '';

  const r = await fetch(`${SERVER_BASE_URL}/auth/refresh`, {
    method: 'POST',
    cache: 'no-store',
    headers: reqCookie ? { Cookie: reqCookie } : undefined,
    redirect: 'manual',
  });

  const text = await r.text();
  if (!r.ok) return { ok: false };

  const { access, expiresInSec } = parseAccessTokenPayload(text);
  const rt = readRefreshCookie(r) ?? undefined;

  return { ok: true, access, expiresInSec, rt };
}

/** 공통 핸들러 */
async function handle(method: string, req: NextRequest, params: { path?: string[] }) {
  const pathOnly = joinPath(params.path ?? []);
  let pathWithSearch = withSearch(pathOnly, req);
  const skipAuth = pathOnly === '/api/recommendations/drive-courses';

  // ✅ 조회수 중복 방지 플래그
  let shouldSetViewCookie = false;
  let viewCookieName: string | null = null;

  // ✅ 조회수 중복 방지: /posts/:id GET에서만 incView 주입
  if (shouldApplyViewTracking(pathOnly, method)) {
    const postId = extractPostId(pathOnly);
    if (postId) {
      viewCookieName = `rp_view_${postId}`;
      const hasViewed = req.cookies.has(viewCookieName);

      const url = new URL(pathWithSearch, 'http://localhost');
      url.searchParams.set('incView', hasViewed ? 'false' : 'true');
      pathWithSearch = url.pathname + url.search;

      shouldSetViewCookie = !hasViewed;
    }
  }

  const hasBody = !(method === 'GET' || method === 'DELETE');
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const REQUEST_HEADER_DROP = new Set([
    'host',
    'connection',
    'content-length',
    'content-encoding',
    'transfer-encoding',
  ]);

  const forwardedHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (REQUEST_HEADER_DROP.has(lower)) return;
    if (lower === 'cookie') return; // be() 에서 별도로 주입
    forwardedHeaders.append(key, value);
  });

  const init: RequestInit = {
    method,
    headers: forwardedHeaders,
    ...(body ? { body } : {}),
  };

  // 1차 호출
  let res = await be(pathWithSearch, { ...init, skipAuth });

  // 로그인 성공 처리
  if (pathOnly === '/auth/login' && res.ok) {
    const text = await res.text();

    const { access, expiresInSec } = parseAccessTokenPayload(text);
    const refresh = readRefreshCookie(res);

    const final = new NextResponse(text, {
      status: res.status,
      headers: passthroughHeaders(res),
    });

    applyAuthCookies(final, { access, expiresInSec, refresh: refresh ?? undefined });
    appendSetCookies(final, res, new Set([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]));
    return final;
  }

  // 401 → refresh 1회
  if (res.status === 401 && !skipAuth) {
    const r = await refreshOnce();
    if (!r.ok) return makeProxyResponse(res);

    const h2 = new Headers(init.headers || {});
    if (r.access) h2.set('Authorization', `Bearer ${r.access}`);

    res = await be(pathWithSearch, { ...init, headers: h2, skipAuth });

    const final = new NextResponse(await readBodySafely(res), {
      status: res.status,
      headers: passthroughHeaders(res),
    });

    appendSetCookies(final, res);
    applyAuthCookies(final, {
      access: r.access,
      expiresInSec: r.expiresInSec,
      refresh: r.rt,
    });

    if (method === 'DELETE' && pathOnly === '/users/me' && final.ok) {
      clearAuthCookies(final);
    }

    // ✅ refresh 재시도 케이스에서도 view cookie는 동일하게 처리
    if (shouldSetViewCookie && res.ok && final.ok && viewCookieName) {
      final.cookies.set({
        name: viewCookieName,
        value: '1',
        path: '/',
        maxAge: VIEW_TTL_SECONDS,
        sameSite: 'lax',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return final;
  }

  // 정상 케이스
  const finalRes = await makeProxyResponse(res);

  if (method === 'DELETE' && pathOnly === '/users/me' && finalRes.ok) {
    clearAuthCookies(finalRes);
  }

  // ✅ 여기서 “Set-Cookie”로 확실히 박아준다 (핵심)
  if (shouldSetViewCookie && res.ok && finalRes.ok && viewCookieName) {
    finalRes.cookies.set({
      name: viewCookieName,
      value: '1',
      path: '/',
      maxAge: VIEW_TTL_SECONDS,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return finalRes;
}

export async function GET(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle('GET', req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle('DELETE', req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle('POST', req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle('PUT', req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle('PATCH', req, ctx.params);
}
