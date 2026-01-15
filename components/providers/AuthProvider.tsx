'use client';

import type React from 'react';

import { startTokenRefreshTimer } from '@/lib/auth-client';
import { useEffect } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 토큰 자동 갱신 타이머 시작
    const cleanup = startTokenRefreshTimer();
    return cleanup;
  }, []);

  return <>{children}</>;
}
