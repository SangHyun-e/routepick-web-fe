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
      description="이메일과 닉네임을 입력하고 시작하세요"
      footer={footer}
      bottomNote="가입 후 이메일 인증을 완료해야 로그인할 수 있습니다."
    >
      <SignUpForm redirectTo={from ?? '/'} />
    </AuthShell>
  );
}
