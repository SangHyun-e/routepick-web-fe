import Link from 'next/link';

import AuthShell from '@/components/shared/AuthShell';
import EmailVerificationForm from '@/feature/auth/components/EmailVerificationForm';

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

export default function VerifyEmailPage({ searchParams }: Props) {
  const fromRaw = pickFirst(searchParams?.from);
  const from = safeFrom(fromRaw);
  const email = pickFirst(searchParams?.email);
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
      title="이메일 인증"
      description="가입한 이메일로 전송된 6자리 코드를 입력하세요"
      footer={footer}
      bottomNote="인증 완료 후 로그인할 수 있습니다."
    >
      <EmailVerificationForm redirectTo={from ?? '/login'} initialEmail={email} />
    </AuthShell>
  );
}
