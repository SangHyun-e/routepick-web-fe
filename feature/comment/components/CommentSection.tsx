// feature/comment/components/CommentSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import CommentList from '@/feature/comment/components/CommentList';
import { useComments } from '@/feature/comment/hooks/useComments';
import { createRootComment } from '@/feature/comment/api';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Pagination from '@/feature/post/list/Pagination';

interface Props {
  postId: number;
  postAuthorId: number | null;
  postAuthorNickname: string | null;
  currentUserId: number | null;
  commentCount: number; //  서버에서 내려온 초기값
}

export default function CommentSection({
  postId,
  postAuthorId,
  postAuthorNickname,
  currentUserId,
  commentCount,
}: Props) {
  const { data, loading, page, setPage, totalPages, refresh } = useComments({
    postId,
    size: 20,
  });

  //  1) 화면에 보여줄 댓글 수 (루트+대댓글, ACTIVE만)
  const [count, setCount] = useState<number>(commentCount);

  //  2) 라우트 이동/새 fetch로 commentCount가 바뀌면 state도 동기화
  useEffect(() => {
    setCount(commentCount);
  }, [commentCount]);

  // 3) 생성/삭제/대댓글 등에 의한 증감만 여기서 처리
  const onCountDelta = (delta: number) => {
    setCount((prev: number) => Math.max(0, prev + delta));
  };

  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const onSubmit = async () => {
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

      // 새로고침 없이 즉시 반영
      onCountDelta(+1);

      toast.success('댓글이 등록되었습니다.');
      setContent('');

      // 목록만 최신화(카운트는 이미 반영했으니 refresh는 목록용)
      await refresh();
    } catch {
      toast.error('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">댓글</h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
          {count}
        </span>
      </div>

      {/* 작성 폼 */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-medium text-slate-900">댓글 작성</p>
          <p className="mt-1 text-xs text-slate-500">Shift+Enter로 줄바꿈, Enter로 등록</p>
        </div>

        <div className="px-6 py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요."
            className="min-h-28 resize-none"
            maxLength={1000}
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void onSubmit();
              }
            }}
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">{content.length}/1000</span>
            <Button
              onClick={onSubmit}
              disabled={submitting || content.trim().length === 0}
              className="min-w-24"
            >
              {submitting ? '등록 중…' : '등록'}
            </Button>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <CommentList
        postId={postId}
        postAuthorId={postAuthorId}
        postAuthorNickname={postAuthorNickname}
        currentUserId={currentUserId}
        comments={data?.content ?? []}
        loading={loading}
        onRefresh={refresh}
        onCountDelta={onCountDelta} //
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(next: number) => setPage(next)}
      />
    </section>
  );
}
