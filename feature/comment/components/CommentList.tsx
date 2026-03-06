// feature/comment/components/CommentList.tsx
'use client';

import CommentItem from '@/feature/comment/components/CommentItem';
import type { CommentResponse } from '@/feature/comment/types';

interface Props {
  postId: number;
  postAuthorId: number | null;
  postAuthorNickname: string | null;
  currentUserId: number | null;
  isAdmin: boolean;
  comments: CommentResponse[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onCountDelta: (delta: number) => void;
  highlightedCommentId?: number | null;
}

export default function CommentList({
  postId,
  postAuthorId,
  postAuthorNickname,
  currentUserId,
  isAdmin,
  comments,
  loading,
  onRefresh,
  onCountDelta,
  highlightedCommentId,
}: Props) {
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
        <CommentItem
          key={comment.id}
          postId={postId}
          postAuthorId={postAuthorId}
          postAuthorNickname={postAuthorNickname}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          comment={comment}
          highlightedCommentId={highlightedCommentId}
          onRefresh={onRefresh}
          onCountDelta={onCountDelta}
        />
      ))}
    </div>
  );
}
