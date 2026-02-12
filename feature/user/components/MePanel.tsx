/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { bffFetch } from '@/lib/bffFetch';
import type { Me } from '@/types/user';
import LogoutButton from '@/components/user/LogoutButton';
import UserProfileCard from '@/components/user/UserProfileCard';
import UserMetaGrid from '@/components/user/UserMetaGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmailVerificationForm from '@/feature/auth/components/EmailVerificationForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { verifyPassword, withdrawUser } from '@/feature/user/api';

export default function MePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Me | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const emailFromQuery = searchParams.get('email') ?? undefined;
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showWithdrawPassword, setShowWithdrawPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    const res = await bffFetch('/api/proxy/users/me');
    const json = await res.json().catch(() => null);
    setStatus(res.status);
    setData(res.ok ? (json as Me) : null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadProfile();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadProfile]);

  const handleWithdrawConfirm = useCallback(
    async (event?: MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      if (!withdrawPassword.trim()) {
        setWithdrawError('비밀번호를 입력해주세요.');
        return;
      }

      setWithdrawError(null);
      setIsWithdrawing(true);
      const verifyRes = await verifyPassword(withdrawPassword);
      if (!verifyRes.ok) {
        setIsWithdrawing(false);
        if (verifyRes.status === 401) {
          setWithdrawError('비밀번호가 올바르지 않습니다.');
          return;
        }
        setWithdrawError(verifyRes.message ?? '비밀번호 확인에 실패했습니다.');
        return;
      }

      const res = await withdrawUser();
      if (!res.ok) {
        setIsWithdrawing(false);
        if (res.status === 401) {
          toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
          router.push('/login?from=/me');
          return;
        }
        toast.error(res.message ?? '회원 탈퇴에 실패했습니다.');
        return;
      }
      toast.success('회원 탈퇴가 완료되었습니다.');
      router.replace('/');
      router.refresh();
    },
    [router, withdrawPassword],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-4 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-slate-200" />
          <div className="mx-auto h-4 w-32 bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!data) {
    const showVerification = status === 401;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-amber-800">로그인이 필요합니다</h2>
          <p className="mt-2 text-sm text-amber-700">
            {status === 401
              ? '세션이 만료되었거나 인증이 필요합니다. 계속하려면 로그인해주세요.'
              : '현재 계정 정보를 불러오지 못했습니다. 다시 시도하거나 로그인해주세요.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => router.push('/login')}
            className="flex-1 rounded-xl bg-slate-900 py-6 text-base font-semibold text-white shadow-md transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            로그인 페이지로 이동
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1 rounded-xl border-slate-300 py-6 text-base font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            홈으로 돌아가기
          </Button>
        </div>

        {showVerification && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">이메일 인증</h3>
            <p className="mt-2 text-sm text-slate-600">
              가입한 이메일로 인증을 다시 진행할 수 있습니다.
            </p>
            <div className="mt-4">
              <EmailVerificationForm
                redirectTo="/me"
                initialEmail={emailFromQuery}
                initialCodeSent={false}
              />
            </div>
          </section>
        )}
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">마이페이지</h1>
          <p className="mt-1 text-sm text-slate-500">내 계정 정보를 한눈에 확인하세요.</p>
        </div>
      </header>

      <UserProfileCard me={data} />
      <UserMetaGrid me={data} />

      {data.status === 'PENDING' && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-amber-800">이메일 인증이 필요합니다</h3>
          <p className="mt-2 text-sm text-amber-700">
            인증 전에는 글쓰기·댓글 작성 등 활동이 제한됩니다. 아래에서 인증을 진행해주세요.
          </p>
          <div className="mt-4 rounded-xl bg-white p-4">
            <EmailVerificationForm
              redirectTo="/me"
              initialEmail={data.email}
              initialCodeSent={false}
            />
          </div>
        </section>
      )}

      {data.role === 'ADMIN' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">관리자 도구</h3>
          <p className="mt-2 text-sm text-slate-600">
            게시글 상태 관리 페이지로 이동할 수 있습니다.
          </p>
          <div className="mt-4">
            <Button
              onClick={() => router.push('/admin/posts')}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              게시글 관리로 이동
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">활동</h3>
        <p className="mt-3 text-sm text-slate-600">곧 추가될 예정입니다.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">계정 관리</h3>
        <p className="mt-2 text-sm text-slate-600">
          회원 탈퇴 시 작성한 게시글과 댓글은 삭제되지 않으며, 작성자는 탈퇴회원으로 표시됩니다.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <LogoutButton
            size="default"
            className="flex-1 justify-center rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          />
          <Button
            variant="outline"
            onClick={() => {
              setWithdrawPassword('');
              setWithdrawError(null);
              setShowWithdrawDialog(true);
            }}
            disabled={isWithdrawing}
            className="flex-1 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            {isWithdrawing ? '탈퇴 처리 중...' : '회원 탈퇴'}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={showWithdrawDialog}
        onOpenChange={(open) => {
          setShowWithdrawDialog(open);
          if (!open) {
            setWithdrawPassword('');
            setWithdrawError(null);
            setIsWithdrawing(false);
            setShowWithdrawPassword(false);
          }
        }}
        title="회원 탈퇴"
        description={
          <div className="space-y-3">
            <p>
              정말 탈퇴하시겠습니까? 탈퇴 후에는 복구할 수 없습니다.
              <br />
              작성한 게시글과 댓글은 그대로 남습니다.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">비밀번호 확인</label>
              <div className="relative">
                <Input
                  type={showWithdrawPassword ? 'text' : 'password'}
                  value={withdrawPassword}
                  onChange={(event) => {
                    setWithdrawPassword(event.target.value);
                    setWithdrawError(null);
                  }}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowWithdrawPassword((prev) => !prev)}
                  aria-label={showWithdrawPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors hover:bg-slate-100"
                >
                  {showWithdrawPassword ? (
                    <EyeOff className="size-4 text-slate-500" />
                  ) : (
                    <Eye className="size-4 text-slate-500" />
                  )}
                </button>
              </div>
              {withdrawError && (
                <p className="text-xs font-medium text-red-600">{withdrawError}</p>
              )}
            </div>
          </div>
        }
        confirmText={isWithdrawing ? '탈퇴 처리 중...' : '탈퇴하기'}
        cancelText="취소"
        variant="destructive"
        confirmDisabled={isWithdrawing}
        onConfirm={handleWithdrawConfirm}
      />
    </div>
  );
}
