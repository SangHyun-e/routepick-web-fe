'use client';

import { toast } from 'sonner';

let refreshPromise: Promise<Response> | null = null;
let isRefreshing = false;

/**
 * 클라이언트에서 리프레시 토큰으로 액세스 토큰 재발급
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    const res = await refreshPromise;
    return res.ok;
  }

  if (isRefreshing) {
    return false;
  }

  isRefreshing = true;

  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  }).finally(() => {
    refreshPromise = null;
    isRefreshing = false;
  });

  const res = await refreshPromise;

  if (!res.ok) {
    console.error('Token refresh failed:', res.status);
  }

  return res.ok;
}

/**
 * 401 에러 발생 시 자동으로 리프레시 시도하는 fetch 래퍼
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const doFetch = () =>
    fetch(input, {
      ...init,
      credentials: init?.credentials ?? 'include',
    });

  let res = await doFetch();

  // 401 에러이고 리프레시 엔드포인트가 아닌 경우
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (
    res.status === 401 &&
    !url.includes('/api/auth/refresh') &&
    !url.includes('/api/auth/login')
  ) {
    // 리프레시 시도
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // 재시도
      res = await doFetch();
    } else {
      // 리프레시 실패 시 로그인 페이지로 이동
      toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
      setTimeout(() => {
        window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      }, 1500);
    }
  }

  return res;
}

/**
 * 주기적으로 토큰 상태 체크 (10초마다 - 테스트용, 실무에서는 3-5분)
 */
export function startTokenRefreshTimer() {
  if (typeof window === 'undefined')
    return () => {
      /* ignore */
    };

  const CHECK_INTERVAL = 3 * 60 * 1000;

  const checkToken = async () => {
    try {
      console.log('Checking token status...');

      // /api/proxy/users/me로 토큰 유효성 체크
      const res = await fetch('/api/proxy/users/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        console.log('Token expired, attempting refresh...');
        // 401이면 리프레시 시도
        const refreshed = await refreshAccessToken();

        if (refreshed) {
          console.log('Token refreshed successfully');
          toast.success('세션이 자동으로 갱신되었습니다.');
        } else {
          console.error('Token refresh failed');
          toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
          setTimeout(() => {
            window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
          }, 1500);
        }
      } else if (res.ok) {
        console.log('Token is valid');
      }
    } catch (error) {
      console.error('Token check failed:', error);
    }
  };

  // 즉시 한번 체크
  checkToken();

  // 주기적 체크
  const interval = setInterval(checkToken, CHECK_INTERVAL);

  // 페이지 언마운트 시 정리
  return () => {
    console.log('Cleaning up token refresh timer');
    clearInterval(interval);
  };
}
