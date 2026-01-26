'use client';

import { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { CommentResponse } from '@/feature/comment/types';
import CommentReplyForm from '@/feature/comment/components/CommentReplyForm';
import { Button } from '@/components/ui/button';

interface Props {
  postId: number;
  comment: CommentResponse;
  onRefresh: () => Promise<void>;
}

function formatDate(iso: string): string {
  const d: Date = new Date(iso);
  const y: number = d.getFullYear();
  const m: string = String(d.getMonth() + 1).padStart(2, '0');
  const day: string = String(d.getDate()).padStart(2, '0');
  const hh: string = String(d.getHours()).padStart(2, '0');
  const mm: string = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export default function CommentItem({ postId, comment, onRefresh }: Props) {
  const isReply: boolean = comment.depth > 0;

  // 루트 댓글만 답글 허용 (원하면 나중에 depth 제한 풀 수 있음)
  const canReply: boolean = !isReply && comment.status === 'ACTIVE';

  const author: string = comment.authorNickname ?? '익명';
  const created: string = useMemo(() => formatDate(comment.createdAt), [comment.createdAt]);

  const [replying, setReplying] = useState<boolean>(false);

  /**
   * UI 컨셉
   * - 루트: Card 느낌(rounded-2xl + shadow-sm)
   * - 대댓글: 왼쪽 연결선 + 살짝 배경 톤다운
   * - 답글 버튼: shadcn Button(ghost/sm)로 통일
   */
  return (
    <div className={isReply ? 'relative pl-6' : ''}>
      {/* ✅ 대댓글 연결선(UX) */}
      {isReply && (
        <>
          {/* 세로 라인 */}
          <span className="absolute top-0 left-2 h-full w-px bg-slate-200" />
          {/* 가로 갈고리 */}
          <span className="absolute top-6 left-2 h-px w-4 bg-slate-200" />
        </>
      )}

      <div
        className={[
          'rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm',
          isReply ? 'bg-slate-50/60 shadow-none' : '',
        ].join(' ')}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sm font-semibold text-slate-900">{author}</span>

              {/* 상태 뱃지(삭제된 댓글이면 content가 이미 마스킹되어 내려옴) */}
              {comment.status === 'DELETED' && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  삭제됨
                </span>
              )}

              <span className="text-xs text-slate-400">{created}</span>
            </div>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-2">
            {canReply && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplying((v) => !v)}
                className="h-8 gap-1 px-2 text-slate-700 hover:text-slate-900"
              >
                <MessageSquare className="h-4 w-4" />
                {replying ? '닫기' : '답글'}
              </Button>
            )}
          </div>
        </div>

        {/* 본문 */}
        <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-700">
          {comment.content}
        </p>

        {/* ✅ 답글 폼 */}
        {canReply && replying && (
          <div className="mt-3">
            <CommentReplyForm
              postId={postId}
              parentId={comment.id}
              onCancel={() => setReplying(false)}
              onSuccess={onRefresh}
            />
          </div>
        )}

        {/* ✅ replies */}
        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} postId={postId} comment={reply} onRefresh={onRefresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
