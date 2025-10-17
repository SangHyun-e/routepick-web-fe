import type * as React from 'react';
import { Card } from '@/components/ui/card';
import BrandLogo from '@/components/shared/BrandLogo';

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo at top */}
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>

        {/* Main card */}
        <Card className="border-border/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6">
            <h1 className="text-balance text-2xl font-bold tracking-tight">로그인</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              드라이브 코스를 탐색하고 공유해보세요
            </p>
          </div>

          {children}

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-xs">
              계정이 없으신가요?{' '}
              <button className="text-primary font-medium hover:underline">회원가입</button>
            </p>
          </div>
        </Card>

        {/* Footer text */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
