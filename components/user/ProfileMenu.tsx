'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  const [profileEmail, setProfileEmail] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const meRes = await bffFetch('/api/proxy/users/me', { cache: 'no-store' });
      if (!mounted) return;
      if (!meRes.ok) return;
      const me = (await meRes.json().catch(() => null)) as Me | null;
      const name = me?.nickname || me?.email?.split('@')[0] || '';
      setProfileName(name);
      setProfileEmail(me?.email ?? '');
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
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={10}
        avoidCollisions
        collisionPadding={12}
        className="w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {initialsFrom(profileName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {profileName || '사용자'}
              </p>
              {profileEmail && <p className="truncate text-xs text-slate-500">{profileEmail}</p>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/me')}
          className="cursor-pointer gap-2 rounded-md px-3 py-2 text-sm text-slate-700 focus:bg-slate-100"
        >
          <User className="size-4" />
          마이페이지
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loading}
          className="cursor-pointer gap-2 rounded-md px-3 py-2 text-sm text-rose-600 focus:bg-rose-50"
        >
          <LogOut className="size-4" />
          {loading ? '로그아웃 중...' : '로그아웃'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
