'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { requestPasswordReset } from '@/feature/auth/api';
import {
  passwordResetRequestSchema,
  type PasswordResetRequestValues,
} from '@/feature/auth/schemas';

function buildConfirmUrl(email: string) {
  const params = new URLSearchParams({ email, requested: '1' });
  return `/password-reset/confirm?${params.toString()}`;
}

export default function PasswordResetRequestForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PasswordResetRequestValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const onSubmit = useCallback(
    async (values: PasswordResetRequestValues) => {
      setServerError(null);
      const res = await requestPasswordReset(values);
      if (res.ok) {
        router.push(buildConfirmUrl(values.email));
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

        {serverError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full font-medium">
          {isSubmitting ? '코드 전송 중...' : '재설정 코드 보내기'}
        </Button>
      </form>
    </Form>
  );
}
