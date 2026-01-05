import { fetchPostServer } from '@/feature/post/api.server';
import PostDetailHeader from '@/feature/post/detail/PostDetailHeader';
import PostDetailContent from '@/feature/post/detail/PostDetailContent';
import PostDetailError from '@/feature/post/detail/PostDetailError';

interface PageProps {
  params: { id: string };
}

export default async function PostDetailPage({ params }: PageProps) {
  const postId = Number(params.id);

  if (!Number.isFinite(postId)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error="잘못된 게시글 ID입니다." />
      </div>
    );
  }

  const res = await fetchPostServer(postId);

  // ❗ 실패 케이스 분리
  if (!res.ok) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error={res.message} />
      </div>
    );
  }

  // ❗ 성공인데 data 없는 경우 (방어)
  if (!res.data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error="게시글 정보를 불러올 수 없습니다." />
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
