import { ACCESS_TOKEN_COOKIE } from '@/lib/cookies';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const c = cookies();
  c.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
  return NextResponse.json({ ok: true });
}
