import { fetchPost } from '@/feature/post/api';
import PostDetailHeader from '@/feature/post/detail/PostDetailHeader';
import PostDetailContent from '@/feature/post/detail/PostDetailContent';
import PostDetailError from '@/feature/post/detail/PostDetailError';

interface PageProps {
  params: { id: string };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = params;
  const postId = Number(id);

  if (!Number.isFinite(postId)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error="잘못된 게시글 ID입니다." />
      </div>
    );
  }

  const res = await fetchPost(postId);

  if (!res.ok || !res.data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error={res.ok ? '게시글 정보를 불러올 수 없습니다.' : res.message} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PostDetailHeader post={res.data} />
      <PostDetailContent post={res.data} />
    </div>
  );
}
