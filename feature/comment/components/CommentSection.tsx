'use client';

import { useComments } from '@/feature/comment/hooks/useComments';
import CommentList from '@/feature/comment/components/CommentList';

interface Props {
  postId: number;
}

export default function CommentSection({ postId }: Props) {
  const { data, loading } = useComments(postId);

  return (
    <section className="mt-10">
      <h2 className="font=semibold mb-4 text-lg text-slate-900">댓글 {data?.totalElements ?? 0}</h2>

      <CommentList comments={data?.content ?? []} loading={loading} />
    </section>
  );
}
