// app/api/proxy/[...path]/route.ts
import { be, splitSetCookies } from '@/lib/be';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { NextResponse } from 'next/server';
import { headers as nextHeaders } from 'next/headers';

/** Set-Cookie 한 줄에서 target 쿠키의 value / max-age 추출 */
function parseCookie(setCookie: string, target: string) {
  const [nameValue, ...attrs] = setCookie.split(';');
  if (!nameValue) return null;

  const [name, ...valueParts] = nameValue.split('=');
  if (!name || name.trim().toLowerCase() !== target.toLowerCase()) return null;

  const value = valueParts.join('=');
  let maxAge: number | undefined;

  for (const a of attrs) {
    const [k, v] = a.split('=');
    if (k && k.trim().toLowerCase() === 'max-age') {
      const n = Number.parseInt((v ?? '').trim(), 10);
      if (Number.isFinite(n)) maxAge = n;
    }
  }
  return { value, maxAge };
}

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

/** BE 응답 → 프록시 응답 생성 (Set-Cookie까지 append) */
async function makeProxyResponse(beRes: Response) {
  const body = await beRes.arrayBuffer();
  const headers = passthroughHeaders(beRes);
  for (const sc of splitSetCookies(beRes)) headers.append('set-cookie', sc);
  return new Response(body, { status: beRes.status, headers });
}

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

  let access: string | undefined;
  let expiresInSec: number | undefined;
  try {
    const json = JSON.parse(text);
    access = json?.access ?? json?.accessToken ?? json?.token ?? undefined;
    expiresInSec = json?.expiresInSec ?? json?.expiresIn;
  } catch {
    /* ignore */
  }

  let rtCookie: { value: string; maxAge?: number } | undefined;
  for (const c of splitSetCookies(r)) {
    const parsed = parseCookie(c, REFRESH_TOKEN_COOKIE);
    if (parsed) {
      rtCookie = { value: parsed.value, maxAge: parsed.maxAge };
      break;
    }
  }

  return { ok: true, access, expiresInSec, rt: rtCookie };
}

/** 공통 핸들러 */
async function handle(method: string, req: Request, params: { path?: string[] }) {
  const pathWithSearch = withSearch(joinPath(params.path ?? []), req);

  const hasBody = !(method === 'GET' || method === 'DELETE');
  const init: RequestInit = hasBody
    ? {
        method,
        body: await req.arrayBuffer(),
        headers: {
          ...(req.headers.get('content-type')
            ? { 'content-type': req.headers.get('content-type')! }
            : {}),
        },
      }
    : { method };

  // 1차 호출
  let res = await be(pathWithSearch, init);
  if (res.status !== 401) {
    // 정상 케이스: BE의 Set-Cookie/헤더 전부 전달
    return makeProxyResponse(res);
  }

  // 401 → refresh 1회 시도
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
  const final = new NextResponse(await res.arrayBuffer(), {
    status: res.status,
    headers: passthroughHeaders(res),
  });

  // 재시도 응답의 Set-Cookie 전파
  for (const sc of splitSetCookies(res)) final.headers.append('set-cookie', sc);

  // rp_at 갱신
  if (r.access) {
    final.cookies.set(ACCESS_TOKEN_COOKIE, r.access, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(Number.isFinite(r.expiresInSec as number) ? { maxAge: r.expiresInSec } : {}),
    });
  }

  // RP_REFRESH 회전 반영
  if (r.rt) {
    final.cookies.set(REFRESH_TOKEN_COOKIE, r.rt.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(r.rt.maxAge !== undefined ? { maxAge: r.rt.maxAge } : {}),
    });
  }

  return final;
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
