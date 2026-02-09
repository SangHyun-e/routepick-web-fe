'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { confirmPasswordReset } from '@/feature/auth/api';
import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmValues,
} from '@/feature/auth/schemas';

type Props = {
  initialEmail?: string;
  showRequestedMessage?: boolean;
};

export default function PasswordResetConfirmForm({
  initialEmail,
  showRequestedMessage = false,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordResetConfirmValues>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      email: initialEmail ?? '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!initialEmail) return;
    form.reset({
      email: initialEmail,
      code: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [form, initialEmail]);

  const onSubmit = useCallback(
    async (values: PasswordResetConfirmValues) => {
      setServerError(null);
      const res = await confirmPasswordReset({
        email: values.email,
        code: values.code,
        newPassword: values.newPassword,
      });
      if (res.ok) {
        router.replace('/login?reset=1');
        router.refresh();
        return;
      }
      setServerError(res.message);
    },
    [router],
  );

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {showRequestedMessage && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            재설정 코드가 전송되었습니다. 이메일을 확인해주세요.
          </div>
        )}

        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">이메일</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  inputMode="email"
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">재설정 코드</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6자리 숫자"
                  maxLength={6}
                  className="h-11 tracking-[0.4em] text-center"
                  onChange={(event) => {
                    const next = event.target.value.replace(/\D/g, '').slice(0, 6);
                    field.onChange(next);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">새 비밀번호</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8~20자, 대/소문자, 숫자, 특수문자 포함"
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors hover:bg-slate-100"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4 text-slate-500" />
                    ) : (
                      <Eye className="size-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">새 비밀번호 확인</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors hover:bg-slate-100"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4 text-slate-500" />
                    ) : (
                      <Eye className="size-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full font-medium">
          {isSubmitting ? '비밀번호 변경 중...' : '비밀번호 변경'}
        </Button>
      </form>
    </Form>
  );
}
