'use client';

import { useRouter } from 'next/navigation';
import { useState, type ComponentProps } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getKakaoLogoutUrl, logout } from '@/feature/auth/api';

type LogoutButtonProps = {
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
};

export default function LogoutButton({
  className = '',
  variant = 'outline',
  size = 'sm',
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const doLogout = async () => {
    try {
      setLoading(true);
      const kakaoLogout = await getKakaoLogoutUrl();
      await logout();
      if (kakaoLogout.ok) {
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
    <Button
      onClick={doLogout}
      disabled={loading}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      <LogOut className="size-4" />
      {loading ? '로그아웃 중...' : '로그아웃'}
    </Button>
  );
}
