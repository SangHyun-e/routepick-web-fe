'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { confirmEmailVerifyCode, sendEmailVerifyCode } from '@/feature/auth/api';
import {
  emailVerifyConfirmSchema,
  emailVerifySendSchema,
  type EmailVerifyConfirmValues,
  type EmailVerifySendValues,
} from '@/feature/auth/schemas';

type Props = {
  redirectTo?: string;
  initialEmail?: string;
};

function withVerifiedParam(path: string) {
  if (!path.startsWith('/login')) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}verified=1`;
}

export default function EmailVerificationForm({
  redirectTo = '/login',
  initialEmail,
}: Props) {
  const router = useRouter();
  const [emailTarget, setEmailTarget] = useState('');
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const sendForm = useForm<EmailVerifySendValues>({
    resolver: zodResolver(emailVerifySendSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const confirmForm = useForm<EmailVerifyConfirmValues>({
    resolver: zodResolver(emailVerifyConfirmSchema),
    defaultValues: { email: '', code: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!initialEmail) return;
    setEmailTarget(initialEmail);
    sendForm.reset({ email: initialEmail });
    confirmForm.reset({ email: initialEmail, code: '' });
    setSendMessage('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
  }, [confirmForm, initialEmail, sendForm]);

  const onSend = useCallback(
    async (values: EmailVerifySendValues) => {
      setSendError(null);
      setSendMessage(null);
      setConfirmError(null);

      const res = await sendEmailVerifyCode(values);
      if (res.ok) {
        setEmailTarget(values.email);
        confirmForm.reset({ email: values.email, code: '' });
        setSendMessage('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
        return;
      }
      setSendError(res.message);
    },
    [confirmForm],
  );

  const onConfirm = useCallback(
    async (values: EmailVerifyConfirmValues) => {
      setConfirmError(null);
      const targetEmail = values.email || emailTarget;
      if (!targetEmail) {
        setConfirmError('먼저 인증 코드를 요청해주세요.');
        return;
      }

      const res = await confirmEmailVerifyCode({ email: targetEmail, code: values.code });
      if (res.ok) {
        router.replace(withVerifiedParam(redirectTo));
        router.refresh();
        return;
      }
      setConfirmError(res.message);
    },
    [emailTarget, redirectTo, router],
  );

  const {
    handleSubmit: handleSendSubmit,
    control: sendControl,
    formState: { isSubmitting: isSending },
  } = sendForm;

  const {
    handleSubmit: handleConfirmSubmit,
    control: confirmControl,
    register: registerConfirm,
    formState: { isSubmitting: isConfirming },
  } = confirmForm;

  const isCodeSent = Boolean(emailTarget);

  return (
    <div className="space-y-6">
      <Form {...sendForm}>
        <form onSubmit={handleSendSubmit(onSend)} className="space-y-4">
          <FormField
            control={sendControl}
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

          {sendError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
              {sendError}
            </div>
          )}
          {sendMessage && (
            <div
              className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
              aria-live="polite"
            >
              {sendMessage}
            </div>
          )}

          <Button type="submit" disabled={isSending} className="h-11 w-full font-medium">
            {isSending
              ? '코드 전송 중...'
              : isCodeSent
                ? '인증 코드 재전송'
                : '인증 코드 보내기'}
          </Button>
        </form>
      </Form>

      <Separator />

      <Form {...confirmForm}>
        <form onSubmit={handleConfirmSubmit(onConfirm)} className="space-y-4">
          <input type="hidden" {...registerConfirm('email')} />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            {emailTarget ? (
              <p className="text-slate-700">
                인증 대상 이메일: <span className="font-semibold">{emailTarget}</span>
              </p>
            ) : (
              <p className="text-slate-500">먼저 이메일을 입력하고 인증 코드를 요청하세요.</p>
            )}
          </div>

          <FormField
            control={confirmControl}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">인증 코드</FormLabel>
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

          {confirmError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
              {confirmError}
            </div>
          )}

          <Button
            type="submit"
            disabled={!isCodeSent || isConfirming}
            className="h-11 w-full font-medium"
          >
            {isConfirming ? '인증 확인 중...' : '인증 완료'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
