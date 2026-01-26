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
          <div key={i} className="h-24 animate-pulse rounded-xl border bg-white" />
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border bg-white py-12 text-center text-sm text-slate-500">
        아직 댓글이 없어요. 첫 댓글의 주인공이 되어보세요 !
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
