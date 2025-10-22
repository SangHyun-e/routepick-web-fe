import { withAuth } from '@/lib/backend';
import { bffFetch } from '@/lib/bffFetch';
import { SERVER_BASE_URL } from '@/lib/env';
import { NextResponse } from 'next/server';

export async function GET() {
  const res = await bffFetch(`${SERVER_BASE_URL}/users/me`, withAuth({ cache: 'no-store' }));
  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? { message: 'error' }, { status: res.status });
}
