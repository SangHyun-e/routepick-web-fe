import { describe, expect, it } from 'vitest';

// splitSetCookies 테스트
function splitSetCookies(header: string | null): string[] {
  if (!header) return [];
  // 콤마로 여러 쿠키 나누되, Expires=Fri, 01 Nov 2025 같은 콤마는 무시
  return header.split(/,(?=\s*[-A-Za-z0-9!#$%&'*+.^_`|~]+=)/);
}

describe('splitSetCookies()', () => {
  it('단일 쿠키 1개만 있을 때는 그대로 반환', () => {
    const input = 'rp_at=abc123; Path=/; httpOnly';
    const result = splitSetCookies(input);
    expect(result).toEqual([input]);
  });

  it('Expires에 콤마가 있어도 잘못 쪼개지지 않아야함', () => {
    const input =
      'RP_REFRESH=xyz; Expires=Fri, 01 Nov 2025 12:00:00 GMT; Path=/; HttpOnly, rp_at=abc; Path=/; HttpOnly';
    const result = splitSetCookies(input);
    expect(result.length).toBe(2);
    expect(result[0]).toContain('RP_REFRESH');
    expect(result[1]).toContain('rp_at');
  });

  it('헤더가 null이면 빈 배열 반환', () => {
    expect(splitSetCookies(null)).toEqual([]);
  });
});

// parseSetCookie 테스트
type ParsedCookie = {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
};

// 실제 파서 복사
function parseSetCookie(cookie: string): ParsedCookie | null {
  const [nameValue, ...rest] = cookie.split(';');
  if (!nameValue) return null;

  const [rawName, ...valueParts] = nameValue.split('=');
  if (!rawName) return null;

  const name = rawName.trim();
  const value = valueParts.join('=');

  const parsed: ParsedCookie = { name, value };

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
        if (['lax', 'strict', 'none'].includes(lowered)) {
          parsed.sameSite = lowered as ParsedCookie['sameSite'];
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

describe('parseSetCookie()', () => {
  it('기본 name/value를 올바르게 파싱해야 함', () => {
    const cookie = 'rp_at=abc123';
    const parsed = parseSetCookie(cookie);
    expect(parsed?.name).toBe('rp_at');
    expect(parsed?.value).toBe('abc123');
  });

  it('Path, Max-Age, SameSite, Secure, HttpOnly 속성을 인식해야 함', () => {
    const cookie = 'RP_REFRESH=xyz; Path=/; Max-Age=3600; SameSite=Lax; Secure; HttpOnly';
    const parsed = parseSetCookie(cookie)!;

    expect(parsed.path).toBe('/');
    expect(parsed.maxAge).toBe(3600);
    expect(parsed.sameSite).toBe('lax');
    expect(parsed.secure).toBe(true);
    expect(parsed.httpOnly).toBe(true);
  });

  it('속성 순서가 뒤죽박죽이어도 올바르게 파싱되어야 함', () => {
    const cookie = 'RP_REFRESH=xyz; HttpOnly; SameSite=None; Secure; Path=/api; Max-Age=1800';
    const parsed = parseSetCookie(cookie)!;
    expect(parsed.httpOnly).toBe(true);
    expect(parsed.sameSite).toBe('none');
    expect(parsed.secure).toBe(true);
    expect(parsed.path).toBe('/api');
    expect(parsed.maxAge).toBe(1800);
  });

  it('잘못된 형식은 null 반환해야 함', () => {
    expect(parseSetCookie('')).toBeNull();
    expect(parseSetCookie('=')).toBeNull();
  });
});
