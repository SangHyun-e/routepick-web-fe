'use client';

import { useEffect, useState } from 'react';
import { bffFetch } from '@/lib/bffFetch';
import type { Me } from '@/types/user';
import UserProfileCard from '@/components/user/UserProfileCard';
import UserMetaGrid from '@/components/user/UserMetaGrid';
import LogoutButton from '@/components/LogoutButton';

export default function MePanel() {
  const [data, setData] = useState<Me | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await bffFetch('/api/me');
        const json = await res.json().catch(() => null);
        if (!mounted) return;

        setStatus(res.status);
        setData(res.ok ? (json as Me) : null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p className="text-muted-foreground text-sm">내 정보 불러오는 중…</p>;

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          내 정보 로드 실패 (status {status ?? '-'})
          {status === 401 && (
            <span className="text-muted-foreground ml-2 text-xs">세션이 만료되었습니다.</span>
          )}
        </div>
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <LogoutButton />
      </div>

      <UserProfileCard me={data} />
      <UserMetaGrid me={data} />

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">활동</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          내 글/댓글/스크랩은 이후 탭으로 확장 예정
        </p>
      </section>
    </div>
  );
}
