'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { MessageCircle, Star } from 'lucide-react';

import CommentList from '@/feature/comment/components/CommentList';
import { useComments } from '@/feature/comment/hooks/useComments';
import { createRootComment, fetchCommentPosition } from '@/feature/comment/api';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Pagination from '@/feature/post/list/Pagination';
import { CommentResponse } from '@/feature/comment/types';
import CommentItem from '@/feature/comment/components/CommentItem';
import type { CommentStreamEvent } from '@/types/realtime';
import { buildRealtimeUrl } from '@/lib/realtime';

interface Props {
  postId: number;
  postAuthorId: number | null;
  postAuthorNickname: string | null;
  currentUserId: number | null;
  isAdmin: boolean;
  isNotice: boolean;
  commentCount: number;
  bestComments?: CommentResponse[];
}

export default function CommentSection({
  postId,
  postAuthorId,
  postAuthorNickname,
  currentUserId,
  isAdmin,
  isNotice,
  commentCount,
  bestComments = [],
}: Props) {
  const { data, loading, page, setPage, totalPages, refresh } = useComments({
    postId,
    size: 20,
  });

  const searchParams = useSearchParams();
  const targetCommentId = useMemo(() => {
    const value = searchParams.get('commentId');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const [count, setCount] = useState<number>(commentCount);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const [targetPageResolved, setTargetPageResolved] = useState(false);

  useEffect(() => {
    setCount(commentCount);
    setNewCommentCount(0);
  }, [commentCount]);

  useEffect(() => {
    setTargetPageResolved(false);
    setHighlightedCommentId(null);
  }, [targetCommentId]);

  useEffect(() => {
    if (!targetCommentId || targetPageResolved) {
      return;
    }

    let mounted = true;
    (async () => {
      const res = await fetchCommentPosition(postId, targetCommentId, 20);
      if (!mounted) return;
      if (!res.ok) {
        setTargetPageResolved(true);
        return;
      }
      if (res.data.page !== page) {
        setPage(res.data.page);
      }
      setTargetPageResolved(true);
    })();

    return () => {
      mounted = false;
    };
  }, [page, postId, setPage, targetCommentId, targetPageResolved]);

  useEffect(() => {
    if (!targetCommentId || loading || !data) {
      return;
    }
    setHighlightedCommentId(targetCommentId);
  }, [data, loading, targetCommentId]);

  useEffect(() => {
    if (!highlightedCommentId) {
      return;
    }
    const attemptScroll = () => {
      const element = document.getElementById(`comment-${highlightedCommentId}`);
      if (!element) {
        return false;
      }
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    };

    if (attemptScroll()) {
      return;
    }

    const timer = window.setTimeout(() => {
      attemptScroll();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [data, highlightedCommentId]);

  useEffect(() => {
    if (!highlightedCommentId) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHighlightedCommentId(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [highlightedCommentId]);

  useEffect(() => {
    if (isNotice) {
      return;
    }

    const eventSource = new EventSource(
      buildRealtimeUrl(`/posts/${postId}/comments/stream`),
    );
    const handleNewComment = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as CommentStreamEvent;
        if (payload?.postId !== postId) {
          return;
        }
        if (payload.authorId && payload.authorId === currentUserId) {
          return;
        }
        setNewCommentCount((prev) => prev + 1);
        setCount((prev) => prev + 1);
      } catch {
        // ignore
      }
    };

    eventSource.addEventListener('new-comment', handleNewComment as EventListener);
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.removeEventListener('new-comment', handleNewComment as EventListener);
      eventSource.close();
    };
  }, [currentUserId, isNotice, postId]);

  const onCountDelta = (delta: number) => {
    setCount((prev: number) => Math.max(0, prev + delta));
  };

  const handleNewCommentRefresh = useCallback(async () => {
    setNewCommentCount(0);
    await refresh();
  }, [refresh]);

  const safeBest: CommentResponse[] = useMemo(() => {
    return Array.isArray(bestComments) ? bestComments : [];
  }, [bestComments]);

  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const onSubmit = async () => {
    if (isNotice) {
      toast.error('공지글에는 댓글을 작성할 수 없습니다.');
      return;
    }
    const trimmed: string = content.trim();

    if (trimmed.length === 0) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }
    if (trimmed.length > 1000) {
      toast.error('댓글은 최대 1000자까지 입력할 수 있습니다.');
      return;
    }
    if (submitting) return;

    setSubmitting(true);

    try {
      const res = await createRootComment(postId, { content: trimmed });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('로그인이 필요합니다.');
          return;
        }
        toast.error(res.message ?? '댓글 작성에 실패했습니다.');
        return;
      }

      onCountDelta(+1);
      toast.success('댓글이 등록되었습니다.');
      setContent('');
      await refresh();
    } catch {
      toast.error('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-slate-900" strokeWidth={2} />
        <h2 className="text-xl font-bold text-slate-900">댓글</h2>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {count}
        </span>
      </div>

      {newCommentCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>새로운 댓글이 {newCommentCount}개 있습니다.</span>
          <button
            type="button"
            onClick={handleNewCommentRefresh}
            className="rounded-lg border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            새로고침
          </button>
        </div>
      )}

      {/* 베스트 댓글 섹션 */}
      {safeBest.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50/50 to-transparent px-5 py-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <p className="text-sm font-bold text-slate-900">베스트 댓글</p>
              <p className="text-xs text-slate-500">좋아요 순 상위 노출</p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {safeBest.map((c: CommentResponse) => (
              <div
                key={c.id}
                className="rounded-xl border border-amber-100/50 bg-white/60 p-4 backdrop-blur-sm transition-all hover:bg-white/80"
              >
                <CommentItem
                  postId={postId}
                  postAuthorId={postAuthorId}
                  postAuthorNickname={postAuthorNickname}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  comment={c}
                  highlightedCommentId={highlightedCommentId}
                  onRefresh={refresh}
                  onCountDelta={() => {
                    /* ignore */
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 댓글 작성 폼 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent px-6 py-4">
          <p className="text-sm font-semibold text-slate-900">댓글 작성</p>
          <p className="mt-1 text-xs text-slate-500">다른 사용자와 의견을 나눠보세요</p>
        </div>

        {isNotice ? (
          <div className="px-6 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              공지글에는 댓글을 작성할 수 없습니다.
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-6 py-4">
            {!currentUserId && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2">
                <p className="text-sm text-blue-800">
                  💡 댓글을 작성하려면{' '}
                  <a href="/login" className="font-semibold underline hover:no-underline">
                    로그인
                  </a>
                  이 필요합니다.
                </p>
              </div>
            )}

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                currentUserId
                  ? '댓글을 입력하세요. (Shift+Enter: 줄바꿈)'
                  : '로그인 후 댓글을 작성할 수 있습니다.'
              }
              className="min-h-28 resize-none border-slate-200 focus:border-slate-400"
              maxLength={1000}
              disabled={submitting || !currentUserId}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void onSubmit();
                }
              }}
            />

            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium ${
                  content.length > 900 ? 'text-amber-600' : 'text-slate-400'
                }`}
              >
                {content.length}/1000
              </span>
              <Button
                onClick={onSubmit}
                disabled={submitting || content.trim().length === 0 || !currentUserId}
                className="min-w-28"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 inline-block animate-spin">⏳</span>
                    등록 중…
                  </>
                ) : (
                  '댓글 등록'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <CommentList
            postId={postId}
            postAuthorId={postAuthorId}
            postAuthorNickname={postAuthorNickname}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            comments={data?.content ?? []}
            loading={loading}
            onRefresh={refresh}
            onCountDelta={onCountDelta}
            highlightedCommentId={highlightedCommentId}
          />

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(next: number) => setPage(next)}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
