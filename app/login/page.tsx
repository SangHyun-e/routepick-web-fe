import AuthShell from '@/components/shared/AuthShell';
import LoginForm from '@/feature/auth/components/LoginForm';

export default function Page() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
