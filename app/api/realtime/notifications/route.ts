import { be } from '@/lib/be';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const beRes = await be('/notifications/stream');

  if (!beRes.ok || !beRes.body) {
    const message = await beRes.text().catch(() => 'SSE 연결에 실패했습니다.');
    return new NextResponse(message, { status: beRes.status });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-store');
  headers.set('Connection', 'keep-alive');

  return new NextResponse(beRes.body, {
    status: beRes.status,
    headers,
  });
}
