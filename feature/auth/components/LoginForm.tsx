'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { login } from '@/feature/auth/api';
import { loginSchema } from '@/feature/auth/schemas';
import type { LoginValues } from '@/feature/auth/schemas';

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
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
                <div>
                  <Input
                    {...field}
                    type="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                    inputMode="email"
                    className="bg-background h-11"
                  />
                </div>
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
                    className="bg-background h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    className="hover:bg-muted absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="text-muted-foreground size-4" />
                    ) : (
                      <Eye className="text-muted-foreground size-4" />
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
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>

        {/* Server error */}
        {serverError && (
          <div
            className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
            aria-live="polite"
          >
            {serverError}
          </div>
        )}

        {/* Submit button */}
        <Button type="submit" disabled={isSubmitting} className="h-11 w-full font-medium">
          {isSubmitting ? '로그인 중...' : '로그인'}
        </Button>
      </form>
    </Form>
  );
}
