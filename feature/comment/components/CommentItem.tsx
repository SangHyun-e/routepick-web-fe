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

  const [replyOpen, setReplyOpen] = useState<boolean>(false);

  return (
    <div className={isReply ? 'ml-6' : ''}>
      <div
        className={[
          'rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm',
          isReply ? 'bg-slate-50' : '',
        ].join(' ')}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{author}</span>

          {isPostAuthor && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
              작성자
            </span>
          )}

          <span className="text-xs text-slate-400">{created}</span>
        </div>

        {/* content */}
        <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">{comment.content}</p>

        {/* actions */}
        {!isReply && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReplyOpen((v) => !v)}
              className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
            >
              {replyOpen ? '답글 닫기' : '답글'}
            </Button>
          </div>
        )}

        {/* reply form */}
        {!isReply && replyOpen && (
          <CommentReplyForm
            postId={postId}
            parentId={comment.id}
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
