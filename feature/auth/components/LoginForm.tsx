'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { getKakaoAuthorizeUrl, login } from '@/feature/auth/api';
import { loginSchema } from '@/feature/auth/schemas';
import type { LoginValues } from '@/feature/auth/schemas';

export default function LoginForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const kakaoButtonLabel = isKakaoLoading ? '카카오 로그인 중...' : '카카오로 로그인';

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const onSubmit = useCallback(
    async (values: LoginValues) => {
      setServerError(null);
      const res = await login(values);
      if (res.ok) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }
      setServerError(res.message);
    },
    [redirectTo, router],
  );

  const onKakaoLogin = useCallback(async () => {
    setServerError(null);
    setIsKakaoLoading(true);
    const state = redirectTo === '/' ? undefined : redirectTo;
    const res = await getKakaoAuthorizeUrl(state);
    if (res.ok) {
      window.location.href = res.data;
      return;
    }
    setServerError(res.message);
    setIsKakaoLoading(false);
  }, [redirectTo]);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email field */}
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

        {/* Password field */}
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
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="current-password"
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

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="/password-reset"
            className="text-xs text-slate-600 transition-colors hover:text-slate-900"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
            {serverError}
          </div>
        )}

        <div className="mx-auto w-full max-w-[300px] space-y-3">
          {/* Submit button */}
          <Button type="submit" disabled={isSubmitting} className="h-[45px] w-full font-medium">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>

          <button
            type="button"
            onClick={onKakaoLogin}
            disabled={isSubmitting || isKakaoLoading}
            aria-label={kakaoButtonLabel}
            aria-busy={isKakaoLoading}
            className={`h-[45px] w-full overflow-hidden rounded-md transition-opacity ${
              isSubmitting || isKakaoLoading ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'
            }`}
          >
            <img
              src="/kakao_login/ko/kakao_login_medium_wide.png"
              srcSet="/kakao_login/ko/kakao_login_medium_wide.png 1x, /kakao_login/ko/kakao_login_large_wide.png 2x"
              width={300}
              height={45}
              alt="카카오로 로그인"
              className="h-full w-full object-contain"
            />
            <span className="sr-only">{kakaoButtonLabel}</span>
          </button>
        </div>
      </form>
    </Form>
  );
}
