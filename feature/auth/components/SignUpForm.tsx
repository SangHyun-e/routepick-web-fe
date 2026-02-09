'use client';

import { useCallback, useState } from 'react';
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
import { signUp } from '@/feature/auth/api';
import { signUpSchema, type SignUpValues } from '@/feature/auth/schemas';

type Props = {
  redirectTo?: string;
};

function buildVerifyUrl(email: string, redirectTo?: string) {
  const params = new URLSearchParams();
  params.set('email', email);
  if (redirectTo) params.set('from', redirectTo);
  return `/verify-email?${params.toString()}`;
}

export default function SignUpForm({ redirectTo }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', nickname: '' },
    mode: 'onSubmit',
  });

  const onSubmit = useCallback(
    async (values: SignUpValues) => {
      setServerError(null);
      const res = await signUp(values);
      if (res.ok) {
        router.replace(buildVerifyUrl(values.email, redirectTo));
        return;
      }
      setServerError(res.message);
    },
    [redirectTo, router],
  );

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">비밀번호</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상, 공백 없음"
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
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">닉네임</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="닉네임을 입력하세요"
                  autoComplete="nickname"
                  className="h-11"
                />
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
          {isSubmitting ? '회원가입 중...' : '회원가입'}
        </Button>
      </form>
    </Form>
  );
}
