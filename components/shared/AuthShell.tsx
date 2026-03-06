import type * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import BrandLogo from '@/components/shared/BrandLogo';

type Props = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode | null;
  bottomNote?: React.ReactNode | null;
};

export default function AuthShell({
  children,
  title = '로그인',
  description = '드라이브 코스를 탐색하고 공유해보세요',
  footer,
  bottomNote,
}: Props) {
  const defaultFooter = (
    <p className="text-muted-foreground text-xs">
      계정이 없으신가요?{' '}
      <Link href="/signup" className="text-primary font-medium hover:underline">
        회원가입
      </Link>
    </p>
  );
  const defaultBottomNote = '로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.';
  const footerContent = footer === undefined ? defaultFooter : footer;
  const bottomNoteContent = bottomNote === undefined ? defaultBottomNote : bottomNote;

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
            <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          </div>

          {children}

          {footerContent && <div className="mt-6 text-center">{footerContent}</div>}
        </Card>

        {bottomNoteContent && (
          <p className="text-muted-foreground mt-6 text-center text-xs">{bottomNoteContent}</p>
        )}
      </div>
    </div>
  );
}
