'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const doLogout = async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      router.replace('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={doLogout}
      disabled={loading}
      className={`h-10 rounded-xl border bg-white px-4 text-sm shadow-sm transition hover:bg-gray-50 active:scale-[0.99] ${className}`}
    >
      {loading ? '로그아웃 중...' : 'Logout'}
    </button>
  );
}
