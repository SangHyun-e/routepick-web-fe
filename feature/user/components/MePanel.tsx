/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { bffFetch } from '@/lib/bffFetch';
import type { Me } from '@/types/user';
import LogoutButton from '@/components/user/LogoutButton';
import UserProfileCard from '@/components/user/UserProfileCard';
import UserMetaGrid from '@/components/user/UserMetaGrid';
import { Button } from '@/components/ui/button';

export default function MePanel() {
  const router = useRouter();
  const [data, setData] = useState<Me | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const res = await bffFetch('/api/proxy/users/me');
    const json = await res.json().catch(() => null);
    setStatus(res.status);
    setData(res.ok ? (json as Me) : null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadProfile();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-4 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-slate-200" />
          <div className="mx-auto h-4 w-32 bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-amber-800">로그인이 필요합니다</h2>
          <p className="mt-2 text-sm text-amber-700">
            {status === 401
              ? '세션이 만료되었거나 인증이 필요합니다. 계속하려면 로그인해주세요.'
              : '현재 계정 정보를 불러오지 못했습니다. 다시 시도하거나 로그인해주세요.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => router.push('/login')}
            className="flex-1 rounded-xl bg-slate-900 py-6 text-base font-semibold text-white shadow-md transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            로그인 페이지로 이동
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1 rounded-xl border-slate-300 py-6 text-base font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">마이페이지</h1>
          <p className="mt-1 text-sm text-slate-500">내 계정 정보를 한눈에 확인하세요.</p>
        </div>
      </header>

      <UserProfileCard me={data} />
      <UserMetaGrid me={data} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">활동</h3>
        <p className="mt-3 text-sm text-slate-600">곧 추가될 예정입니다.</p>
      </section>

      <div className="pt-2">
        <LogoutButton
          size="default"
          className="w-full justify-center rounded-xl border-red-200 text-red-600 hover:bg-red-50"
        />
      </div>
    </div>
  );
}
