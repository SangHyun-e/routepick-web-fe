import Link from 'next/link';

import AuthShell from '@/components/shared/AuthShell';
import SignUpForm from '@/feature/auth/components/SignUpForm';

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function safeFrom(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (!raw.startsWith('/')) return undefined;
  if (raw.startsWith('//')) return undefined;
  return raw;
}

export default function SignUpPage({ searchParams }: Props) {
  const fromRaw = pickFirst(searchParams?.from);
  const from = safeFrom(fromRaw);
  const footer = (
    <p className="text-muted-foreground text-xs">
      이미 계정이 있으신가요?{' '}
      <Link href="/login" className="text-primary font-medium hover:underline">
        로그인
      </Link>
    </p>
  );

  return (
    <AuthShell
      title="회원가입"
      description="이메일 인증을 완료하면 활동 제한이 해제됩니다"
      footer={footer}
      bottomNote="인증 전에는 글쓰기·댓글 작성이 제한되며, 마이페이지에서 나중에 인증할 수 있어요."
    >
      <SignUpForm redirectTo={from ?? '/'} />
    </AuthShell>
  );
}
