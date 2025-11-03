import { NextResponse } from 'next/server';
import { SERVER_BASE_URL } from '@/lib/env';
import { ACCESS_TOKEN_COOKIE, accessTokenCookieOptions } from '@/lib/cookies';

// BE가 여러 개의 Set-Cookie를 보낼 수 있으므로 안전하게 분리
function splitSetCookies(res: Response): string[] {
  const raw = res.headers.get('set-cookie');
  if (!raw) return [];
  // Expires= 의 콤마는 무시하고, 다음 쿠키 name= 기준으로 분리
  return raw.split(/,(?=\s*[-A-Za-z0-9!#$%&'*+.^_`|~]+=[^;]+)/);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ message: 'email/password required' }, { status: 400 });
    }

    // 1) BE 로그인 호출
    const beRes = await fetch(`${SERVER_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ email, password }),
      redirect: 'manual',
    });

    const text = await beRes.text();
    // 실패면 BE의 Set-Cookie(실패 케이스에도 있을 수 있음)까지 그대로 전달
    if (!beRes.ok) {
      const fail = new NextResponse(text, {
        status: beRes.status,
        headers: {
          'content-type': beRes.headers.get('content-type') ?? 'application/json',
        },
      });
      for (const sc of splitSetCookies(beRes)) fail.headers.append('set-cookie', sc);
      return fail;
    }

    // 2) 성공: access / expires 파싱 (키 이름 다양성 대응)
    let access: string | undefined;
    let expiresInSec: number | undefined;
    try {
      const json = JSON.parse(text);
      access = json?.access ?? json?.accessToken ?? json?.token ?? undefined;
      const ex = json?.expiresInSec ?? json?.expiresIn;
      if (typeof ex === 'number' && Number.isFinite(ex)) expiresInSec = ex;
    } catch {
      // ignore
    }

    if (!access) {
      const resp = NextResponse.json({ message: 'Token not found in response' }, { status: 500 });
      // BE가 내려준 쿠키는 그대로 전달(디버깅/호환)
      for (const sc of splitSetCookies(beRes)) resp.headers.append('set-cookie', sc);
      return resp;
    }

    // 3) 최종 응답 생성
    const ok = new NextResponse(text, {
      status: 200,
      headers: { 'content-type': beRes.headers.get('content-type') ?? 'application/json' },
    });

    // 4) rp_at(Access) 쿠키는 **우리가 직접** 심는다
    ok.cookies.set(ACCESS_TOKEN_COOKIE, access, {
      ...accessTokenCookieOptions,
      ...(typeof expiresInSec === 'number' ? { maxAge: expiresInSec } : {}),
    });

    // 5) BE의 Set-Cookie(= RP_REFRESH 등) 전부 그대로 forward
    for (const sc of splitSetCookies(beRes)) ok.headers.append('set-cookie', sc);

    return ok;
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
