import { describe, expect, it } from 'vitest';
import { parseSetCookie, splitSetCookies } from '@/lib/httpCookies';

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
