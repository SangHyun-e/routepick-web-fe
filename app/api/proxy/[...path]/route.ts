import { be } from '@/lib/be';
import {
  appendSetCookies,
  applyAuthCookies,
  parseAccessTokenPayload,
  readRefreshCookie,
} from '@/lib/authTokens';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { NextResponse } from 'next/server';
import { headers as nextHeaders } from 'next/headers';

/** /a//b/ → /a/b 정규화 */
function joinPath(segments: string[]) {
  const p = '/' + (segments ?? []).map((s) => s.replace(/^\/+|\/+$/g, '')).join('/');
  return p === '/' ? '' : p;
}

/** 원요청의 ?query=… 그대로 붙이기 */
function withSearch(path: string, req: Request) {
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

/** BE 응답 → 프록시 응답 생성 (Set-Cookie까지 append) */
async function makeProxyResponse(beRes: Response) {
  const final = new NextResponse(await readBodySafely(beRes), {
    status: beRes.status,
    headers: passthroughHeaders(beRes),
  });
  appendSetCookies(final, beRes);
  return final;
}

/** (로그 확인용 마스킹) */
// function mask(s?: string) {
//   if (!s) return '';
//   return s.slice(0, 16) + '…';
// }

/** 401 때 1회 refresh (절대 URL + 쿠키 전달) */
async function refreshOnce(): Promise<{
  ok: boolean;
  access?: string;
  expiresInSec?: number;
  rt?: { value: string; maxAge?: number };
}> {
  const headers = nextHeaders();
  const reqCookie = headers.get('cookie') ?? '';

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
async function handle(method: string, req: Request, params: { path?: string[] }) {
  const pathOnly = joinPath(params.path ?? []); // 쿼리 제외 경로 (특수처리 용)
  const pathWithSearch = withSearch(pathOnly, req); // 쿼리 포함 경로 (일반 프록시 요청)

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
  let res = await be(pathWithSearch, init);

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

  // 401 → refresh 1회 시도
  if (res.status === 401) {
    const r = await refreshOnce();
    if (!r.ok) {
      // 실패면 기존 401을 그대로 전달(쿠키도 그대로 append)
      return makeProxyResponse(res);
    }

    // refresh 성공 → access를 Authorization으로 붙여 안정적으로 재시도
    const h2 = new Headers(init.headers || {});
    if (r.access) h2.set('Authorization', `Bearer ${r.access}`);
    res = await be(pathWithSearch, { ...init, headers: h2 });

    // 최종 응답 생성(재시도 응답의 쿠키/헤더 append)
    const final = new NextResponse(await readBodySafely(res), {
      status: res.status,
      headers: passthroughHeaders(res),
    });

    // 재시도 응답의 Set-Cookie 전파
    appendSetCookies(final, res);
    applyAuthCookies(final, {
      access: r.access,
      expiresInSec: r.expiresInSec,
      refresh: r.rt,
    });

    return final;
  }

  // 정상 케이스: BE의 Set-Cookie/헤더 전부 전달
  return makeProxyResponse(res);
}

export async function GET(req: Request, ctx: { params: { path?: string[] } }) {
  return handle('GET', req, ctx.params);
}
export async function DELETE(req: Request, ctx: { params: { path?: string[] } }) {
  return handle('DELETE', req, ctx.params);
}
export async function POST(req: Request, ctx: { params: { path?: string[] } }) {
  return handle('POST', req, ctx.params);
}
export async function PUT(req: Request, ctx: { params: { path?: string[] } }) {
  return handle('PUT', req, ctx.params);
}
export async function PATCH(req: Request, ctx: { params: { path?: string[] } }) {
  return handle('PATCH', req, ctx.params);
}
