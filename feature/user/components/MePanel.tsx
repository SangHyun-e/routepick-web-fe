/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
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
import type { MyCommentListItem } from '@/feature/comment/types';
import type { PostListItemResponse } from '@/feature/post/types';
import {
  activateMyPost,
  fetchMyComments,
  fetchMyPosts,
  hideMyPost,
  verifyPassword,
  withdrawUser,
} from '@/feature/user/api';

const ACTIVITY_PAGE_SIZE = 10;
type PostStatusFilter = 'ALL' | 'ACTIVE' | 'HIDDEN';

const POST_STATUS_OPTIONS: { value: PostStatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'HIDDEN', label: '숨김' },
];

const POST_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '활성',
  HIDDEN: '숨김',
  DELETED: '삭제',
};

type ActivityState<T> = {
  items: T[];
  page: number;
  total: number | null;
  loading: boolean;
  error: string | null;
};

const createActivityState = <T,>(): ActivityState<T> => ({
  items: [],
  page: 0,
  total: null,
  loading: false,
  error: null,
});

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

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
  const [activityTab, setActivityTab] = useState<'posts' | 'comments'>('posts');
  const [postStatusFilter, setPostStatusFilter] = useState<PostStatusFilter>('ALL');
  const [postActionId, setPostActionId] = useState<number | null>(null);
  const [activityPosts, setActivityPosts] = useState<ActivityState<PostListItemResponse>>(
    createActivityState<PostListItemResponse>(),
  );
  const [activityComments, setActivityComments] = useState<ActivityState<MyCommentListItem>>(
    createActivityState<MyCommentListItem>(),
  );
  const isMountedRef = useRef(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const activityEmptyMessage =
    activityTab === 'posts'
      ? '아직 작성한 글이 없어요. 첫 글을 작성해볼까요?'
      : '아직 작성한 댓글이 없어요.';
  const activeActivity = activityTab === 'posts' ? activityPosts : activityComments;
  const activeItems = activeActivity.items;
  const activeLoading = activeActivity.loading;
  const activeError = activeActivity.error;
  const activeHasMore =
    activeActivity.total !== null && activeActivity.items.length < activeActivity.total;
  const showActivityEmpty = !activeLoading && !activeError && activeItems.length === 0;
  const hasActiveItems = activeItems.length > 0;
  const showActivityError = Boolean(activeError) && !hasActiveItems;
  const isKakaoAccount = data?.authProvider === 'KAKAO';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const loadPostsPage = useCallback(
    async (page: number, replace: boolean) => {
      setActivityPosts((prev) => ({
        ...prev,
        ...(replace ? { items: [], page: 0, total: null } : {}),
        loading: true,
        error: null,
      }));

      try {
        const result = await fetchMyPosts(page, ACTIVITY_PAGE_SIZE, postStatusFilter);
        if (!isMountedRef.current) return;

        if (result.ok) {
          setActivityPosts((prev) => ({
            items: replace ? result.data.content : [...prev.items, ...result.data.content],
            page: result.data.number,
            total: result.data.totalElements,
            loading: false,
            error: null,
          }));
          return;
        }

        setActivityPosts((prev) => ({
          ...prev,
          ...(replace ? { items: [], page: 0, total: null } : {}),
          loading: false,
          error: result.message,
        }));
      } catch {
        if (!isMountedRef.current) return;
        setActivityPosts((prev) => ({
          ...prev,
          ...(replace ? { items: [], page: 0, total: null } : {}),
          loading: false,
          error: '활동을 불러오지 못했습니다.',
        }));
      }
    },
    [postStatusFilter],
  );

  const loadCommentsPage = useCallback(async (page: number, replace: boolean) => {
    setActivityComments((prev) => ({
      ...prev,
      ...(replace ? { items: [], page: 0, total: null } : {}),
      loading: true,
      error: null,
    }));

    try {
      const result = await fetchMyComments(page, ACTIVITY_PAGE_SIZE);
      if (!isMountedRef.current) return;

      if (result.ok) {
        setActivityComments((prev) => ({
          items: replace ? result.data.content : [...prev.items, ...result.data.content],
          page: result.data.number,
          total: result.data.totalElements,
          loading: false,
          error: null,
        }));
        return;
      }

      setActivityComments((prev) => ({
        ...prev,
        ...(replace ? { items: [], page: 0, total: null } : {}),
        loading: false,
        error: result.message,
      }));
    } catch {
      if (!isMountedRef.current) return;
      setActivityComments((prev) => ({
        ...prev,
        ...(replace ? { items: [], page: 0, total: null } : {}),
        loading: false,
        error: '활동을 불러오지 못했습니다.',
      }));
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    void loadPostsPage(0, true);
  }, [data?.id, loadPostsPage, postStatusFilter]);

  useEffect(() => {
    if (!data) return;
    void loadCommentsPage(0, true);
  }, [data?.id, loadCommentsPage]);

  const loadMorePosts = useCallback(async () => {
    if (activityPosts.loading || activityPosts.error) return;
    if (activityPosts.total !== null && activityPosts.items.length >= activityPosts.total) return;
    void loadPostsPage(activityPosts.page + 1, false);
  }, [activityPosts, loadPostsPage]);

  const loadMoreComments = useCallback(async () => {
    if (activityComments.loading || activityComments.error) return;
    if (
      activityComments.total !== null &&
      activityComments.items.length >= activityComments.total
    ) {
      return;
    }
    void loadCommentsPage(activityComments.page + 1, false);
  }, [activityComments, loadCommentsPage]);

  const handlePostStatusChange = useCallback(
    async (postId: number, action: 'hide' | 'activate') => {
      setPostActionId(postId);
      const result = action === 'hide' ? await hideMyPost(postId) : await activateMyPost(postId);
      setPostActionId(null);

      if (!result.ok) {
        if (result.status === 401 || result.status === 403) {
          toast.error('로그인이 필요합니다.');
          router.push('/login?from=/me');
          return;
        }
        toast.error(result.message ?? '요청에 실패했습니다.');
        return;
      }

      toast.success(action === 'hide' ? '게시글을 숨김 처리했습니다.' : '게시글을 활성화했습니다.');
      void loadPostsPage(0, true);
    },
    [loadPostsPage, router],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (activityTab === 'posts') {
          void loadMorePosts();
        } else {
          void loadMoreComments();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activityTab, loadMorePosts, loadMoreComments]);

  const handleWithdrawConfirm = useCallback(
    async (event?: MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      if (!isKakaoAccount) {
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
      } else {
        setWithdrawError(null);
        setIsWithdrawing(true);
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
    [isKakaoAccount, router, withdrawPassword],
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => router.push('/admin/posts')}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              게시글 관리로 이동
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/comments')}
              className="rounded-xl border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              댓글 관리로 이동
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">활동</h3>
        <div className="mt-4">
          <div className="flex w-fit rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActivityTab('posts')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activityTab === 'posts'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              내가 쓴 글
            </button>
            <button
              type="button"
              onClick={() => setActivityTab('comments')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activityTab === 'comments'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              내가 쓴 댓글
            </button>
          </div>
          {activityTab === 'posts' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>상태</span>
              <select
                value={postStatusFilter}
                onChange={(event) => {
                  setPostStatusFilter(event.target.value as PostStatusFilter);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {POST_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
            {activeLoading && !hasActiveItems && (
              <p className="text-sm text-slate-500">활동을 불러오는 중...</p>
            )}
            {showActivityError && (
              <p className="text-sm text-rose-500">{activeError}</p>
            )}
            {!activeLoading && !activeError && showActivityEmpty && (
              <p className="text-sm text-slate-500">{activityEmptyMessage}</p>
            )}
            {hasActiveItems && activityTab === 'posts' && (
              <ul className="mt-4 space-y-3">
                {activityPosts.items.map((post) => (
                  <li key={post.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <Link
                        href={`/posts/${post.id}`}
                        className="min-w-0 flex-1 transition hover:text-blue-600"
                      >
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                          {post.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {post.region && <span>{post.region}</span>}
                          <span>{formatActivityDate(post.createdAt)}</span>
                          <span>댓글 {post.commentCount ?? 0}</span>
                        </div>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                          {POST_STATUS_LABEL[post.status] ?? post.status}
                        </span>
                        {post.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handlePostStatusChange(post.id, 'hide')}
                            disabled={postActionId === post.id}
                            className="rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
                            숨김
                          </button>
                        )}
                        {post.status === 'HIDDEN' && (
                          <button
                            type="button"
                            onClick={() => handlePostStatusChange(post.id, 'activate')}
                            disabled={postActionId === post.id}
                            className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            활성화
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {hasActiveItems && activityTab === 'comments' && (
              <ul className="mt-4 space-y-3">
                {activityComments.items.map((comment) => (
                  <li key={comment.id}>
                    <Link
                      href={`/posts/${comment.postId}`}
                      className="block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-500">게시글</p>
                          <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-900">
                            {comment.postTitle}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatActivityDate(comment.createdAt)}
                        </span>
                      </div>
                      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <span className="mr-2 text-xs font-semibold text-slate-400">댓글</span>
                        <span className="line-clamp-2">{comment.content}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {activeError && hasActiveItems && (
              <p className="mt-3 text-xs text-rose-500">{activeError}</p>
            )}
            {!activeError && activeHasMore && (
              <div
                ref={sentinelRef}
                className="mt-4 flex items-center justify-center text-xs text-slate-400"
              >
                {activeLoading ? '더 불러오는 중...' : '스크롤하면 더 불러옵니다.'}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">계정 관리</h3>
        <p className="mt-2 text-sm text-slate-600">
          회원 탈퇴 시 작성한 게시글과 댓글은 삭제되지 않으며, 작성자는 탈퇴회원으로 표시됩니다.
          <br />
          카카오 로그인 계정은 탈퇴 시 카카오 연결이 해제됩니다.
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
            <p className="text-sm text-slate-600">
              카카오 로그인 계정은 탈퇴 시 카카오 연결이 해제됩니다.
            </p>
            {isKakaoAccount ? (
              <p className="text-sm text-slate-600">
                카카오 로그인 계정은 비밀번호 확인 없이 탈퇴됩니다.
              </p>
            ) : (
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
            )}
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
