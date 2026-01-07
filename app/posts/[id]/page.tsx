import { fetchPostServer } from '@/feature/post/api.server';
import PostDetailHeader from '@/feature/post/detail/PostDetailHeader';
import PostDetailContent from '@/feature/post/detail/PostDetailContent';
import PostDetailError from '@/feature/post/detail/PostDetailError';
import { fetchMeServer } from '@/feature/user/api.server';

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

  // 실패 케이스 분리
  if (!res.ok) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error={res.message} />
      </div>
    );
  }

  // 성공인데 data 없는 경우 (방어)
  if (!res.data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error="게시글 정보를 불러올 수 없습니다." />
      </div>
    );
  }

  // me는 실패해도 detail 렌더링에 영향 없음 -> isOwner만 false 처리
  const meRes = await fetchMeServer();
  const isOwner = meRes.ok && meRes.data.id === res.data.authorId;

  return (
    <div className="min-h-screen bg-slate-50">
      <PostDetailHeader post={res.data} isOwner={isOwner} />
      <PostDetailContent post={res.data} />
    </div>
  );
}
