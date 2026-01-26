'use client';

import { CommentResponse } from '@/feature/comment/types';

interface Props {
  comment: CommentResponse;
}

export default function CommentItem({ comment }: Props) {
  const isReply = comment.depth > 0;

  return (
    <div className={`rounded-lg border px-4 py-3 ${isReply ? 'ml-6 bg-slate-50' : 'bg-white'}`}>
      <div className="mb-1 flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-800">{comment.authorNickname ?? '익명'}</span>
        <span className="text-xs text-slate-400">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm whitespace-pre-wrap text-slate-700">{comment.content}</p>

      {/* replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
}
