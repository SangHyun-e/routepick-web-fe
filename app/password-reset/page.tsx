import Link from 'next/link';

import AuthShell from '@/components/shared/AuthShell';
import PasswordResetRequestForm from '@/feature/auth/components/PasswordResetRequestForm';

export default function PasswordResetPage() {
  const footer = (
    <p className="text-muted-foreground text-xs">
      계정이 기억나셨나요?{' '}
      <Link href="/login" className="text-primary font-medium hover:underline">
        로그인
      </Link>
    </p>
  );

  return (
    <AuthShell
      title="비밀번호 재설정"
      description="가입한 이메일로 재설정 코드를 보내드립니다"
      footer={footer}
      bottomNote="가입된 이메일이 있다면 재설정 코드를 전송합니다."
    >
      <PasswordResetRequestForm />
    </AuthShell>
  );
}
