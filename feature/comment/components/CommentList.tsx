'use client';

import CommentItem from '@/feature/comment/components/CommentItem';
import type { CommentResponse } from '@/feature/comment/types';

interface Props {
  comments: CommentResponse[];
  loading: boolean;
}

export default function CommentList({ comments, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border bg-white py-10 text-center text-sm text-slate-500">
        아직 댓글이 없습니다.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
