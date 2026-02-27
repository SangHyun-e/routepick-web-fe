'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getKakaoLogoutUrl, logout } from '@/feature/auth/api';
import { bffFetch } from '@/lib/bffFetch';
import { initialsFrom } from '@/lib/ui';
import type { Me } from '@/types/user';

export default function ProfileMenu() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const meRes = await bffFetch('/api/proxy/users/me', { cache: 'no-store' });
      if (!mounted) return;
      if (!meRes.ok) return;
      const me = (await meRes.json().catch(() => null)) as Me | null;
      const name = me?.nickname || me?.email?.split('@')[0] || '';
      setProfileName(name);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      let shouldLogoutFromKakao = false;
      const meRes = await bffFetch('/api/proxy/users/me', { cache: 'no-store' });
      if (meRes.ok) {
        const me = (await meRes.json().catch(() => null)) as Me | null;
        shouldLogoutFromKakao = me?.authProvider === 'KAKAO';
      }

      const kakaoLogout = shouldLogoutFromKakao ? await getKakaoLogoutUrl() : null;
      await logout();
      if (kakaoLogout?.ok) {
        window.location.href = kakaoLogout.data;
        return;
      }
      router.replace('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="프로필 메뉴"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {initialsFrom(profileName)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-lg p-1">
        <DropdownMenuItem
          onClick={() => router.push('/me')}
          className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          마이페이지
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loading}
          className="cursor-pointer rounded-md px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="size-4" />
          {loading ? '로그아웃 중...' : '로그아웃'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
