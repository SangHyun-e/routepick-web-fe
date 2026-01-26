'use client';

import { useState } from 'react';
import type { CommentResponse } from '@/feature/comment/types';
import CommentReplyForm from '@/feature/comment/components/CommentReplyForm';
import { Button } from '@/components/ui/button';

interface Props {
  postId: number;
  postAuthorId: number | null;
  postAuthorNickname: string | null;
  comment: CommentResponse;
  onRefresh: () => Promise<void>;
}

function renderContentWithMentions(text: string): React.ReactNode {
  // 단어 단위로 분리해서 @로 시작하면 하이라이트
  const parts: string[] = text.split(/(\s+)/); // 공백 토큰 유지

  return parts.map((part: string, idx: number) => {
    const trimmed: string = part.trim();

    // 공백은 그대로
    if (trimmed.length === 0) {
      return <span key={idx}>{part}</span>;
    }

    // @로 시작하는 토큰이면 하이라이트
    if (trimmed.startsWith('@') && trimmed.length >= 2) {
      return (
        <span key={idx} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700">
          {part}
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export default function CommentItem({
  postId,
  postAuthorId,
  postAuthorNickname,
  comment,
  onRefresh,
}: Props) {
  const isReply: boolean = comment.depth > 0;
  const author: string = comment.authorNickname ?? '익명';
  const created: string = formatDate(comment.createdAt);

  const isPostAuthor: boolean =
    postAuthorId != null && comment.authorId != null && postAuthorId === comment.authorId;

  // 답글은 항상 "루트(본댓글)" 밑에 달리도록 parentId 결정
  // - 루트면 rootId = comment.id
  // - 대댓글이면 rootId = comment.parentId (즉, 본댓글 id)
  const rootId: number = comment.parentId ?? comment.id;

  const [replyOpen, setReplyOpen] = useState<boolean>(false);

  return (
    <div className={isReply ? 'ml-6' : ''}>
      <div
        className={[
          'rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm',
          isReply ? 'bg-slate-50' : '',
        ].join(' ')}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{author}</span>

            {isPostAuthor && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                작성자
              </span>
            )}

            <span className="text-xs text-slate-400">{created}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReplyOpen((v) => !v)}
            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
          >
            {replyOpen ? '닫기' : '답글'}
          </Button>
        </div>

        <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">
          {renderContentWithMentions(comment.content)}
        </p>

        {replyOpen && (
          <CommentReplyForm
            postId={postId}
            parentId={rootId}
            mentionNickname={comment.authorNickname ?? postAuthorNickname}
            onSuccess={onRefresh}
            onCancel={() => setReplyOpen(false)}
          />
        )}

        {/* replies */}
        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                postId={postId}
                postAuthorId={postAuthorId}
                postAuthorNickname={postAuthorNickname}
                comment={reply}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
