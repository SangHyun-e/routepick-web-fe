'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/shared/AuthShell';
import { loginWithKakao } from '@/feature/auth/api';
import { bffFetch } from '@/lib/bffFetch';
import type { Me } from '@/types/user';

function safeFrom(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  const code = useMemo(() => searchParams.get('code'), [searchParams]);
  const redirectTo = useMemo(() => safeFrom(searchParams.get('state')), [searchParams]);

  useEffect(() => {
    if (!code) {
      setError('인가 코드가 없습니다. 다시 시도해주세요.');
      return;
    }

    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const run = async () => {
      const res = await loginWithKakao(code);
      if (res.ok) {
        const meRes = await bffFetch('/api/proxy/users/me', { cache: 'no-store' });
        if (meRes.ok) {
          const me = (await meRes.json().catch(() => null)) as Me | null;
          if (me?.authProvider === 'KAKAO' && me.profileComplete === false) {
            const next = new URL('/auth/kakao/nickname', window.location.origin);
            if (redirectTo && redirectTo !== '/') {
              next.searchParams.set('from', redirectTo);
            }
            router.replace(next.pathname + next.search);
            return;
          }
        }
        router.replace(redirectTo);
        router.refresh();
        return;
      }
      setError(res.message);
    };

    run();
  }, [code, redirectTo, router]);

  return (
    <AuthShell
      title="카카오 로그인"
      description="카카오 로그인을 처리 중입니다."
      footer={null}
      bottomNote={null}
    >
      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : (
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          잠시만 기다려주세요...
        </div>
      )}
    </AuthShell>
  );
}
