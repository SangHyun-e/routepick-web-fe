import { Me } from '@/types/user';
import { useEffect, useState } from 'react';

export default function MePanel() {
  const [data, setData] = useState<Me | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
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

  if (loading) {
    return <p className="text-muted-foreground text-sm">내 정보 불러오는 중 ...</p>;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          {/** 로그아웃 버튼 추가 예정 */}
        </div>
      </div>
    );
  }
}
