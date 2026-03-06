export type ParsedSetCookie = {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
};

export function splitSetCookies(input: Response | string | null): string[] {
  const header = typeof input === 'string' ? input : input?.headers.get('set-cookie');
  if (!header) return [];
  // Expires= 안의 콤마는 무시하고, 다음 쿠키 name= 기준으로 분리
  return header.split(/,(?=\s*[-A-Za-z0-9!#$%&'*+.^_`|~]+=[^;]+)/);
}

export function parseSetCookie(cookie: string): ParsedSetCookie | null {
  const [nameValue, ...rest] = cookie.split(';');
  if (!nameValue) return null;

  const [rawName, ...valueParts] = nameValue.split('=');
  if (!rawName) return null;

  const name = rawName.trim();
  const value = valueParts.join('=');
  if (!name) return null;

  const parsed: ParsedSetCookie = { name, value };

  for (const part of rest) {
    const [rawKey, rawVal] = part.split('=');
    const key = rawKey?.trim().toLowerCase();
    const val = rawVal?.trim();

    switch (key) {
      case 'path':
        parsed.path = val;
        break;
      case 'max-age': {
        const n = Number.parseInt(val ?? '', 10);
        if (Number.isFinite(n)) parsed.maxAge = n;
        break;
      }
      case 'samesite': {
        const lowered = (val ?? '').toLowerCase();
        if (lowered === 'lax' || lowered === 'strict' || lowered === 'none') {
          parsed.sameSite = lowered as ParsedSetCookie['sameSite'];
        }
        break;
      }
      case 'secure':
        parsed.secure = true;
        break;
      case 'httponly':
        parsed.httpOnly = true;
        break;
      default:
        if (!key && rawKey?.trim().toLowerCase() === 'secure') parsed.secure = true;
        if (!key && rawKey?.trim().toLowerCase() === 'httponly') parsed.httpOnly = true;
        break;
    }
  }

  return parsed;
}
