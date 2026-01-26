'use client';

import { CommentResponse } from '@/feature/comment/types';

interface Props {
  comment: CommentResponse;
}

export default function CommentItem({ comment }: Props) {
  const isReply: boolean = comment.depth > 0;
  const author: string = comment.authorNickname ?? '익명';
  const created: string = new Date(comment.createdAt).toLocaleDateString();

  return (
    <div className={isReply ? 'ml-6' : ''}>
      <div className={`rounded-xl border bg-white px-4 py-3 ${isReply ? 'bg-slate-50' : ''}`}>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{author}</span>
          <span className="text-xs text-slate-400">{created}</span>
        </div>

        <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">{comment.content}</p>

        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
