import Link from 'next/link';

import AuthShell from '@/components/shared/AuthShell';
import PasswordResetConfirmForm from '@/feature/auth/components/PasswordResetConfirmForm';

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function PasswordResetConfirmPage({ searchParams }: Props) {
  const email = pickFirst(searchParams?.email);
  const requested = pickFirst(searchParams?.requested);
  const showRequestedMessage = requested === '1' || requested === 'true';
  const footer = (
    <p className="text-muted-foreground text-xs">
      로그인으로 돌아가기{' '}
      <Link href="/login" className="text-primary font-medium hover:underline">
        로그인
      </Link>
    </p>
  );

  return (
    <AuthShell
      title="비밀번호 재설정"
      description="이메일로 받은 코드와 새 비밀번호를 입력하세요"
      footer={footer}
      bottomNote="코드는 일정 시간 후 만료됩니다."
    >
      <PasswordResetConfirmForm
        initialEmail={email}
        showRequestedMessage={showRequestedMessage}
      />
    </AuthShell>
  );
}
