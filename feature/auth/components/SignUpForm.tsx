'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

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
import {
  confirmEmailVerifyCode,
  login,
  sendEmailVerifyCode,
  signUp,
} from '@/feature/auth/api';
import {
  emailVerifyConfirmSchema,
  signUpSchema,
  type EmailVerifyConfirmValues,
  type SignUpValues,
} from '@/feature/auth/schemas';

type Props = {
  redirectTo?: string;
};

type StoredSignUp = {
  email: string;
  password: string;
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

export default function SignUpForm({ redirectTo }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nickname: '',
      termsAgreement: false,
      privacyAgreement: false,
    },
    mode: 'onSubmit',
  });

  const confirmForm = useForm<EmailVerifyConfirmValues>({
    resolver: zodResolver(emailVerifyConfirmSchema),
    defaultValues: { email: '', code: '' },
    mode: 'onSubmit',
  });

  const ensureSignedUp = useCallback(
    async (values: SignUpValues) => {
      if (hasSignedUp) {
        return { ok: true, email: verificationEmail || values.email, signedUpNow: false };
      }

      const res = await signUp({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
      });

      if (!res.ok) {
        setServerError(res.message);
        return { ok: false };
      }

      try {
        sessionStorage.setItem(
          SIGNUP_SESSION_KEY,
          JSON.stringify({ email: values.email, password: values.password }),
        );
      } catch {
        // ignore storage errors
      }

      setVerificationEmail(values.email);
      setVerificationMessage('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
      setHasRequestedCode(true);
      setHasSignedUp(true);
      confirmForm.reset({ email: values.email, code: '' });

      return { ok: true, email: values.email, signedUpNow: true };
    },
    [confirmForm, hasSignedUp, verificationEmail],
  );

  const onSendCode = useCallback(
    async (values: SignUpValues) => {
      setServerError(null);
      setSendError(null);
      setVerificationMessage(null);
      setConfirmError(null);

      const result = await ensureSignedUp(values);
      if (!result.ok) return;

      if (result.signedUpNow) {
        return;
      }

      const targetEmail = result.email;
      if (!targetEmail) {
        setSendError('인증할 이메일을 확인해주세요.');
        return;
      }

      const res = await sendEmailVerifyCode({ email: targetEmail });
      if (res.ok) {
        setVerificationMessage('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
        setHasRequestedCode(true);
        return;
      }
      setSendError(res.message);
    },
    [ensureSignedUp],
  );

  const onConfirm = useCallback(
    async (values: EmailVerifyConfirmValues) => {
      setConfirmError(null);
      const targetEmail = values.email || verificationEmail;
      if (!targetEmail) {
        setConfirmError('인증할 이메일을 확인해주세요.');
        return;
      }

      const res = await confirmEmailVerifyCode({
        email: targetEmail,
        code: values.code,
      });
      if (res.ok) {
        const stored = readStoredSignup();
        clearStoredSignup();
        if (stored && stored.email === targetEmail) {
          const loginRes = await login({ email: stored.email, password: stored.password });
          if (loginRes.ok) {
            router.replace(redirectTo ?? '/');
            router.refresh();
            return;
          }
        }

        router.replace(buildLoginRedirect(redirectTo));
        router.refresh();
        return;
      }
      setConfirmError(res.message);
    },
    [redirectTo, router, verificationEmail],
  );

  const onSkipVerification = useCallback(async () => {
    setIsSkipping(true);
    const stored = readStoredSignup();
    if (stored) {
      const loginRes = await login({ email: stored.email, password: stored.password });
      if (loginRes.ok) {
        clearStoredSignup();
        router.replace('/me');
        router.refresh();
        return;
      }
    }
    setIsSkipping(false);
    router.replace('/login?from=/me');
  }, [router]);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = form;

  const agreementError = errors.termsAgreement?.message ?? errors.privacyAgreement?.message;

  const handleSendCode = handleSubmit(onSendCode);
  const handleComplete = handleSubmit(async (values) => {
    setServerError(null);
    setSendError(null);
    setVerificationMessage(null);
    setConfirmError(null);

    const result = await ensureSignedUp(values);
    if (!result.ok) return;

    const codeValue = (confirmForm.getValues('code') ?? '').trim();
    if (codeValue) {
      const valid = await confirmForm.trigger('code');
      if (!valid) return;
      await onConfirm({ email: result.email ?? values.email, code: codeValue });
      return;
    }

    setShowSkipDialog(true);
  });

  const {
    handleSubmit: handleConfirmSubmit,
    control: confirmControl,
    register: registerConfirm,
    formState: { isSubmitting: isConfirming },
  } = confirmForm;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form id="signup-form" onSubmit={handleComplete} className="space-y-5">
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
                    disabled={hasSignedUp}
                  />
                </FormControl>
                <FormMessage />
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    className="h-10 w-full"
                    onClick={handleSendCode}
                  >
                    {isSubmitting
                      ? '인증 코드 전송 중...'
                      : hasRequestedCode
                        ? '인증 코드 재전송'
                        : '이메일 인증하기'}
                  </Button>
                </div>
              </FormItem>
            )}
          />

          {sendError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
              {sendError}
            </div>
          )}
          {verificationMessage && (
            <div
              className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
              aria-live="polite"
            >
              {verificationMessage}
            </div>
          )}

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
                      disabled={hasSignedUp}
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
                <FormLabel className="text-sm font-medium">비밀번호 확인</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    autoComplete="new-password"
                    className="h-11"
                    disabled={hasSignedUp}
                  />
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
                    disabled={hasSignedUp}
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

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            이메일 인증을 완료하면 활동 제한이 해제됩니다.
          </div>

          <div className="space-y-3">
            <FormField
              control={control}
              name="termsAgreement"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={hasSignedUp}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal text-slate-600">
                    이용약관 동의{' '}
                    <Link href="/terms" className="text-primary font-medium hover:underline">
                      (보기)
                    </Link>
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="privacyAgreement"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={hasSignedUp}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal text-slate-600">
                    개인정보처리방침 동의{' '}
                    <Link href="/privacy" className="text-primary font-medium hover:underline">
                      (보기)
                    </Link>
                  </FormLabel>
                </FormItem>
              )}
            />

            {agreementError && (
              <p className="text-sm font-medium text-red-500" role="alert">
                {agreementError}
              </p>
            )}
          </div>
        </form>
      </Form>

      {hasSignedUp && (
        <div className="space-y-6">
          <Separator />

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-700">
              인증 대상 이메일: <span className="font-semibold">{verificationEmail}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              이메일로 받은 6자리 코드를 입력하세요.
            </p>
          </div>

          <Form {...confirmForm}>
            <form onSubmit={handleConfirmSubmit(onConfirm)} className="space-y-4">
              <input type="hidden" {...registerConfirm('email')} />

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
              <button type="submit" className="hidden" aria-hidden="true" />
            </form>
          </Form>
        </div>
      )}
      <Button
        type="submit"
        form="signup-form"
        disabled={isSubmitting || isSkipping || isConfirming}
        className="h-11 w-full font-medium"
      >
        {isSubmitting || isSkipping ? '회원가입 처리 중...' : '회원가입 완료'}
      </Button>
      <ConfirmDialog
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
        title="이메일 인증 미완료"
        description={
          <>
            이메일 인증이 완료되지 않았습니다. 그래도 회원가입을 진행하시겠습니까?
            <br />
            마이페이지에서 나중에 인증할 수 있습니다.
          </>
        }
        confirmText="회원가입 진행"
        cancelText="돌아가기"
        onConfirm={() => {
          setShowSkipDialog(false);
          void onSkipVerification();
        }}
      />
    </div>
  );
}
