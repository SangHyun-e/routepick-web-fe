import AuthShell from '@/components/shared/AuthShell';
import LoginForm from '@/feature/auth/components/LoginForm';

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function safeFrom(raw?: string): string | undefined {
  if (!raw) return undefined;

  // 오픈 리다이렉트 방지: 무조건 내부 경로만 허용
  if (!raw.startsWith('/')) return undefined;
  if (raw.startsWith('//')) return undefined;

  return raw;
}

export default function LoginPage({ searchParams }: Props) {
  const fromRaw = pickFirst(searchParams?.from);
  const from = safeFrom(fromRaw);

  return (
    <AuthShell>
      <LoginForm redirectTo={from ?? '/'} />
    </AuthShell>
  );
}
