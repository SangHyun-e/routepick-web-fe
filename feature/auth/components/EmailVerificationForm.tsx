'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
import { confirmEmailVerifyCode, login, sendEmailVerifyCode } from '@/feature/auth/api';
import {
  emailVerifyConfirmSchema,
  emailVerifySendSchema,
  type EmailVerifyConfirmValues,
  type EmailVerifySendValues,
} from '@/feature/auth/schemas';

type Props = {
  redirectTo?: string;
  initialEmail?: string;
  initialCodeSent?: boolean;
};

type StoredSignUp = {
  email: string;
  password: string;
};

type LoginPrompt = {
  targetEmail: string;
  stored: StoredSignUp | null;
};

const SIGNUP_SESSION_KEY = 'routepick:signup';

function buildLoginRedirect(redirectTo?: string) {
  const params = new URLSearchParams();
  params.set('verified', '1');
  if (redirectTo) {
    params.set('from', redirectTo);
  }
  return `/login?${params.toString()}`;
}

function readStoredSignup(): StoredSignUp | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSignUp;
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearStoredSignup() {
  try {
    sessionStorage.removeItem(SIGNUP_SESSION_KEY);
  } catch {
    // ignore
  }
}

export default function EmailVerificationForm({
  redirectTo = '/login',
  initialEmail,
  initialCodeSent = true,
}: Props) {
  const router = useRouter();
  const [emailTarget, setEmailTarget] = useState('');
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<LoginPrompt | null>(null);

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
    setSendError(null);
    setConfirmError(null);
    if (initialCodeSent) {
      setSendMessage('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
      setHasRequestedCode(true);
    } else {
      setSendMessage(null);
      setHasRequestedCode(false);
    }
  }, [confirmForm, initialCodeSent, initialEmail, sendForm]);

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
        setHasRequestedCode(true);
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
      if (!targetEmail || !hasRequestedCode) {
        setConfirmError('먼저 인증 코드를 요청해주세요.');
        return;
      }

      const res = await confirmEmailVerifyCode({ email: targetEmail, code: values.code });
      if (res.ok) {
        const stored = readStoredSignup();
        setLoginPrompt({ targetEmail, stored });
        setShowLoginDialog(true);
        return;
      }
      setConfirmError(res.message);
    },
    [emailTarget, hasRequestedCode],
  );

  const handleLoginChoice = useCallback(
    async (shouldLogin: boolean) => {
      if (!loginPrompt) return;
      const { targetEmail, stored } = loginPrompt;
      clearStoredSignup();
      setShowLoginDialog(false);
      setLoginPrompt(null);

      if (shouldLogin && stored && stored.email === targetEmail) {
        const loginRes = await login({ email: stored.email, password: stored.password });
        if (loginRes.ok) {
          router.replace(redirectTo ?? '/');
          router.refresh();
          return;
        }
      }

      router.replace(buildLoginRedirect(redirectTo));
      router.refresh();
    },
    [loginPrompt, redirectTo, router],
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

  const isCodeSent = hasRequestedCode;

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
      <ConfirmDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title="회원가입 완료"
        description="회원가입이 완료되었습니다. 로그인하시겠습니까?"
        confirmText="로그인"
        cancelText="나중에"
        onConfirm={() => {
          void handleLoginChoice(true);
        }}
        onCancel={() => {
          void handleLoginChoice(false);
        }}
      />
    </div>
  );
}
