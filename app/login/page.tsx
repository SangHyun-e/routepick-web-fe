import AuthShell from '@/components/shared/AuthShell';
import LoginForm from '@/feature/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm redirectTo="/" />
    </AuthShell>
  );
}
