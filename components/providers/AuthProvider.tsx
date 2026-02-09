'use client';

import type React from 'react';
import { usePathname } from 'next/navigation';
import { startTokenRefreshTimer } from '@/lib/auth-client';
import { useEffect } from 'react';

const PUBLIC_PATHS = ['/login', '/signup', '/verify-email', '/'];
const PUBLIC_PREFIXES = ['/password-reset'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isPublic =
      PUBLIC_PATHS.includes(pathname) ||
      PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isPublic) {
      console.log('Skipping token check on public page:', pathname);
      return;
    }

    console.log('Starting token refresh timer on protected page:', pathname);
    // 토큰 자동 갱신 타이머 시작
    const cleanup = startTokenRefreshTimer();
    return cleanup;
  }, [pathname]);

  return <>{children}</>;
}
