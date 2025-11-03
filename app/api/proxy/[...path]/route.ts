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
  const final = new NextResponse(await beRes.arrayBuffer(), {
    status: beRes.status,
    headers: passthroughHeaders(beRes),
  });
  for (const sc of splitSetCookies(beRes)) final.headers.append('set-cookie', sc);
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

    let access: string | undefined;
    let expiresInSec: number | undefined;
    try {
      const json = JSON.parse(text);
      access = json?.access ?? json?.accessToken ?? json?.token ?? undefined;
      expiresInSec = json?.expiresInSec ?? json?.expiresIn;
    } catch {
      /* ignore */
    }

    const final = new NextResponse(text, {
      status: res.status,
      headers: passthroughHeaders(res),
    });

    // 1) BE가 내려준 Set-Cookie 전부 전달 (원본 보존)
    for (const sc of splitSetCookies(res)) final.headers.append('set-cookie', sc);

    // 2) rp_at 강제 심기
    if (access) {
      final.cookies.set(ACCESS_TOKEN_COOKIE, access, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        ...(typeof expiresInSec === 'number' && Number.isFinite(expiresInSec)
          ? { maxAge: expiresInSec }
          : {}),
      });
    }

    // 3) RP_REFRESH도 강제 심기 (원본 헤더가 로컬 http 조건에서 버려지는 경우 대비)
    let rtParsed: { value: string; maxAge?: number } | null = null;
    for (const sc of splitSetCookies(res)) {
      const p = parseCookie(sc, REFRESH_TOKEN_COOKIE);
      if (p) {
        rtParsed = p;
        break;
      }
    }
    if (rtParsed) {
      final.cookies.set(REFRESH_TOKEN_COOKIE, rtParsed.value, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production', // 로컬 http면 false
        path: '/',
        ...(rtParsed.maxAge !== undefined ? { maxAge: rtParsed.maxAge } : {}),
      });
    }

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
        ...(typeof r.expiresInSec === 'number' && Number.isFinite(r.expiresInSec)
          ? { maxAge: r.expiresInSec }
          : {}),
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
