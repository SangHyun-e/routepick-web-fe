/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { bffFetch } from '@/lib/bffFetch';
import type { Me } from '@/types/user';
import UserProfileCard from '@/components/user/UserProfileCard';
import UserMetaGrid from '@/components/user/UserMetaGrid';
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
import EmailVerificationForm from '@/feature/auth/components/EmailVerificationForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { logout } from '@/feature/auth/api';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from '@/feature/auth/schemas';
import type { MyCommentListItem } from '@/feature/comment/types';
import type { PostListItemResponse } from '@/feature/post/types';
import type { CourseRecommendationSaveResponse } from '@/feature/course/types';
import { fetchSavedRecommendations } from '@/feature/course/api';
import {
  activateMyPost,
  changeMyPassword,
  fetchMyComments,
  fetchMyPosts,
  fetchMyScraps,
  hideMyPost,
  updateMyNickname,
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

const nicknameSchema = z.object({
  nickname: z.string().min(1, '닉네임을 입력하세요').max(40, '닉네임은 40자 이하입니다'),
});

type NicknameValues = z.infer<typeof nicknameSchema>;

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
    newPassword: z.string().regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
    confirmPassword: z.string().min(1, '비밀번호를 다시 입력하세요'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

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
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showWithdrawPassword, setShowWithdrawPassword] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activityTab, setActivityTab] = useState<'posts' | 'comments' | 'scraps' | 'saved'>(
    'posts',
  );
  const [postStatusFilter, setPostStatusFilter] = useState<PostStatusFilter>('ALL');
  const [postActionId, setPostActionId] = useState<number | null>(null);
  const [activityPosts, setActivityPosts] = useState<ActivityState<PostListItemResponse>>(
    createActivityState<PostListItemResponse>(),
  );
  const [activityComments, setActivityComments] = useState<ActivityState<MyCommentListItem>>(
    createActivityState<MyCommentListItem>(),
  );
  const [activityScraps, setActivityScraps] = useState<ActivityState<PostListItemResponse>>(
    createActivityState<PostListItemResponse>(),
  );
  const [activitySavedCourses, setActivitySavedCourses] =
    useState<ActivityState<CourseRecommendationSaveResponse>>(
      createActivityState<CourseRecommendationSaveResponse>(),
    );
  const isMountedRef = useRef(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const activityEmptyMessage =
    activityTab === 'posts'
      ? '아직 작성한 글이 없어요. 첫 글을 작성해볼까요?'
      : activityTab === 'comments'
        ? '아직 작성한 댓글이 없어요.'
        : activityTab === 'scraps'
          ? '아직 스크랩한 글이 없어요.'
          : '저장한 추천 코스가 아직 없어요.';
  const activeActivity =
    activityTab === 'posts'
      ? activityPosts
      : activityTab === 'comments'
        ? activityComments
        : activityTab === 'scraps'
          ? activityScraps
          : activitySavedCourses;
  const activeItems = activeActivity.items;
  const activeLoading = activeActivity.loading;
  const activeError = activeActivity.error;
  const activeHasMore =
    activeActivity.total !== null && activeActivity.items.length < activeActivity.total;
  const showActivityEmpty = !activeLoading && !activeError && activeItems.length === 0;
  const hasActiveItems = activeItems.length > 0;
  const showActivityError = Boolean(activeError) && !hasActiveItems;
  const isKakaoAccount = data?.authProvider === 'KAKAO';
  const nicknameForm = useForm<NicknameValues>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: { nickname: '' },
    mode: 'onSubmit',
  });
  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

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

  useEffect(() => {
    if (!data) return;
    nicknameForm.reset({ nickname: data.nickname ?? '' });
    setNicknameError(null);
  }, [data, nicknameForm]);

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

  const loadScrapsPage = useCallback(async (page: number, replace: boolean) => {
    setActivityScraps((prev) => ({
      ...prev,
      ...(replace ? { items: [], page: 0, total: null } : {}),
      loading: true,
      error: null,
    }));

    try {
      const result = await fetchMyScraps(page, ACTIVITY_PAGE_SIZE);
      if (!isMountedRef.current) return;

      if (result.ok) {
        setActivityScraps((prev) => ({
          items: replace ? result.data.content : [...prev.items, ...result.data.content],
          page: result.data.number,
          total: result.data.totalElements,
          loading: false,
          error: null,
        }));
        return;
      }

      setActivityScraps((prev) => ({
        ...prev,
        ...(replace ? { items: [], page: 0, total: null } : {}),
        loading: false,
        error: result.message,
      }));
    } catch {
      if (!isMountedRef.current) return;
      setActivityScraps((prev) => ({
        ...prev,
        ...(replace ? { items: [], page: 0, total: null } : {}),
        loading: false,
        error: '스크랩을 불러오지 못했습니다.',
      }));
    }
  }, []);

  const loadSavedCoursesPage = useCallback(async (page: number, replace: boolean) => {
    setActivitySavedCourses((prev) => ({
      ...prev,
      ...(replace ? { items: [], page: 0, total: null } : {}),
      loading: true,
      error: null,
    }));

    try {
      const result = await fetchSavedRecommendations(page, ACTIVITY_PAGE_SIZE);
      if (!isMountedRef.current) return;

      if (result.ok) {
        setActivitySavedCourses((prev) => ({
          items: replace ? result.data.content : [...prev.items, ...result.data.content],
          page: result.data.number,
          total: result.data.totalElements,
          loading: false,
          error: null,
        }));
        return;
      }

      setActivitySavedCourses((prev) => ({
        ...prev,
        ...(replace ? { items: [], page: 0, total: null } : {}),
        loading: false,
        error: result.message,
      }));
    } catch {
      if (!isMountedRef.current) return;
      setActivitySavedCourses((prev) => ({
        ...prev,
        ...(replace ? { items: [], page: 0, total: null } : {}),
        loading: false,
        error: '저장된 추천 코스를 불러오지 못했습니다.',
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

  useEffect(() => {
    if (!data) return;
    void loadScrapsPage(0, true);
  }, [data?.id, loadScrapsPage]);

  useEffect(() => {
    if (!data) return;
    void loadSavedCoursesPage(0, true);
  }, [data?.id, loadSavedCoursesPage]);

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

  const loadMoreScraps = useCallback(async () => {
    if (activityScraps.loading || activityScraps.error) return;
    if (activityScraps.total !== null && activityScraps.items.length >= activityScraps.total) {
      return;
    }
    void loadScrapsPage(activityScraps.page + 1, false);
  }, [activityScraps, loadScrapsPage]);

  const loadMoreSavedCourses = useCallback(async () => {
    if (activitySavedCourses.loading || activitySavedCourses.error) return;
    if (
      activitySavedCourses.total !== null &&
      activitySavedCourses.items.length >= activitySavedCourses.total
    ) {
      return;
    }
    void loadSavedCoursesPage(activitySavedCourses.page + 1, false);
  }, [activitySavedCourses, loadSavedCoursesPage]);

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
          return;
        }
        if (activityTab === 'comments') {
          void loadMoreComments();
          return;
        }
        if (activityTab === 'scraps') {
          void loadMoreScraps();
          return;
        }
        void loadMoreSavedCourses();
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activityTab, loadMorePosts, loadMoreComments, loadMoreScraps, loadMoreSavedCourses]);

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

      const trimmedReason = withdrawReason.trim();
      const res = await withdrawUser(trimmedReason.length > 0 ? trimmedReason : null);
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
    [isKakaoAccount, router, withdrawPassword, withdrawReason],
  );

  const handleNicknameSubmit = useCallback(
    async (values: NicknameValues) => {
      setNicknameError(null);
      const res = await updateMyNickname(values.nickname);
      if (res.ok) {
        toast.success('닉네임이 변경되었습니다.');
        await loadProfile();
        return;
      }
      setNicknameError(res.message ?? '닉네임 변경에 실패했습니다.');
    },
    [loadProfile],
  );

  const handlePasswordSubmit = useCallback(
    async (values: PasswordChangeValues) => {
      setPasswordError(null);
      const res = await changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (!res.ok) {
        setPasswordError(res.message ?? '비밀번호 변경에 실패했습니다.');
        return;
      }

      toast.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      await logout();
      router.replace('/login');
      router.refresh();
    },
    [router],
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
            게시글·댓글·유저 관리 페이지로 이동할 수 있습니다.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => router.push('/admin/posts')}
              variant="outline"
              className="rounded-xl border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
            <Button
              variant="outline"
              onClick={() => router.push('/admin/users')}
              className="rounded-xl border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              유저 관리로 이동
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">계정 설정</h3>
        <p className="mt-2 text-sm text-slate-600">
          프로필과 보안 설정은 필요할 때만 수정하세요.
        </p>
        <div className="mt-4 space-y-3">
          <details className="group rounded-xl border border-slate-200 bg-slate-50">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-sm font-semibold text-slate-900">닉네임 변경</p>
                <p className="text-xs text-slate-500">현재 닉네임: {data.nickname ?? '-'}</p>
              </div>
              <ChevronDown className="size-4 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-4">
              <Form {...nicknameForm}>
                <form
                  onSubmit={nicknameForm.handleSubmit(handleNicknameSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={nicknameForm.control}
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
                  {nicknameError && (
                    <div
                      className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                      aria-live="polite"
                    >
                      {nicknameError}
                    </div>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={nicknameForm.formState.isSubmitting}
                  >
                    {nicknameForm.formState.isSubmitting ? '변경 중...' : '닉네임 변경'}
                  </Button>
                </form>
              </Form>
            </div>
          </details>

          <details className="group rounded-xl border border-slate-200 bg-slate-50">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-sm font-semibold text-slate-900">비밀번호 변경</p>
                <p className="text-xs text-slate-500">
                  {isKakaoAccount
                    ? '카카오 로그인 계정은 비밀번호 변경이 불가합니다.'
                    : '주기적으로 변경해 계정을 안전하게 관리하세요.'}
                </p>
              </div>
              <ChevronDown className="size-4 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-4">
              {isKakaoAccount ? (
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  카카오 로그인 계정은 비밀번호를 변경할 수 없습니다.
                </div>
              ) : (
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                    className="space-y-4"
                  >
                    <p className="text-xs text-slate-500">{PASSWORD_POLICY_MESSAGE}</p>
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">현재 비밀번호</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder="현재 비밀번호를 입력하세요"
                                autoComplete="current-password"
                                className="h-11 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                aria-label={
                                  showCurrentPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                                }
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors hover:bg-slate-100"
                              >
                                {showCurrentPassword ? (
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
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">새 비밀번호</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="새 비밀번호를 입력하세요"
                                autoComplete="new-password"
                                className="h-11 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                aria-label={showNewPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors hover:bg-slate-100"
                              >
                                {showNewPassword ? (
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
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">새 비밀번호 확인</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="새 비밀번호를 다시 입력하세요"
                                autoComplete="new-password"
                                className="h-11 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={
                                  showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                                }
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors hover:bg-slate-100"
                              >
                                {showConfirmPassword ? (
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
                    {passwordError && (
                      <div
                        className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        aria-live="polite"
                      >
                        {passwordError}
                      </div>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      {passwordForm.formState.isSubmitting ? '변경 중...' : '비밀번호 변경'}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </details>
        </div>
      </section>

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
            <button
              type="button"
              onClick={() => setActivityTab('scraps')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activityTab === 'scraps'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              스크랩
            </button>
            <button
              type="button"
              onClick={() => setActivityTab('saved')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activityTab === 'saved'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              추천 저장
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
            {hasActiveItems && activityTab === 'scraps' && (
              <ul className="mt-4 space-y-3">
                {activityScraps.items.map((post) => (
                  <li key={post.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <Link
                      href={`/posts/${post.id}`}
                      className="block transition hover:text-blue-600"
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
                  </li>
                ))}
              </ul>
            )}
            {hasActiveItems && activityTab === 'saved' && (
              <ul className="mt-4 space-y-3">
                {activitySavedCourses.items.map((course) => (
                  <li key={course.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{course.theme}</span>
                        <span>{formatActivityDate(course.createdAt)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {course.routeSummary}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {course.stops.map((stop) => (
                          <span
                            key={`${course.id}-${stop.name}-${stop.x}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5"
                          >
                            {stop.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 whitespace-pre-line">
                        {course.explanation}
                      </p>
                    </div>
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
          계정 삭제는 복구할 수 없으므로 신중하게 진행해주세요.
        </p>
        <details className="group mt-4 rounded-xl border border-rose-200 bg-rose-50/60">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-sm font-semibold text-rose-600">회원 탈퇴</p>
              <p className="text-xs text-rose-400">작성한 콘텐츠는 유지됩니다.</p>
            </div>
            <ChevronDown className="size-4 text-rose-300 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-rose-200/60 bg-white px-4 pb-4 pt-4">
            <p className="text-sm text-slate-600">
              회원 탈퇴 시 작성한 게시글과 댓글은 삭제되지 않으며, 작성자는 탈퇴회원으로 표시됩니다.
              {isKakaoAccount && (
                <>
                  <br />
                  카카오 로그인 계정은 탈퇴 시 카카오 연결이 해제됩니다.
                </>
              )}
            </p>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWithdrawPassword('');
                  setWithdrawReason('');
                  setWithdrawError(null);
                  setShowWithdrawDialog(true);
                }}
                disabled={isWithdrawing}
                className="rounded-md border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                {isWithdrawing ? '탈퇴 처리 중...' : '회원 탈퇴'}
              </Button>
            </div>
          </div>
        </details>
      </section>

      <ConfirmDialog
        open={showWithdrawDialog}
        onOpenChange={(open) => {
          setShowWithdrawDialog(open);
          if (!open) {
            setWithdrawPassword('');
            setWithdrawReason('');
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
            {isKakaoAccount ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  카카오 로그인 계정은 탈퇴 시 카카오 연결이 해제됩니다.
                </p>
                <p className="text-sm text-slate-600">
                  카카오 로그인 계정은 비밀번호 확인 없이 탈퇴됩니다.
                </p>
              </div>
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
            <div className="space-y-2">
              <label htmlFor="withdraw-reason" className="text-sm font-medium text-slate-700">
                탈퇴 사유(선택)
              </label>
              <textarea
                id="withdraw-reason"
                value={withdrawReason}
                onChange={(event) => setWithdrawReason(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="탈퇴 사유를 입력하세요"
              />
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
