'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import AuthShell from '@/components/shared/AuthShell';
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
import { updateMyNickname } from '@/feature/user/api';

const nicknameSchema = z.object({
  nickname: z.string().min(1, '닉네임을 입력하세요').max(40, '닉네임은 40자 이하입니다'),
});

type NicknameValues = z.infer<typeof nicknameSchema>;

function safeFrom(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

export default function KakaoNicknamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const redirectTo = safeFrom(searchParams.get('from'));

  const form = useForm<NicknameValues>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: { nickname: '' },
    mode: 'onSubmit',
  });

  const onSubmit = useCallback(
    async (values: NicknameValues) => {
      setServerError(null);
      const res = await updateMyNickname(values.nickname);
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
    <AuthShell
      title="닉네임 설정"
      description="서비스에서 사용할 닉네임을 설정해주세요."
      footer={null}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">닉네임</FormLabel>
                <FormControl>
                  <Input
                    {...field}
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
            {isSubmitting ? '저장 중...' : '닉네임 저장'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
