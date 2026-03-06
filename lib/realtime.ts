const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:8080';

export const REALTIME_BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

export function buildRealtimeUrl(path: string) {
  return `${REALTIME_BASE_URL}${path}`;
}
