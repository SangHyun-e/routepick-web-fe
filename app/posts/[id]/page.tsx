import { fetchPostServer } from '@/feature/post/api.server';
import PostDetailHeader from '@/feature/post/components/PostDetailHeader';
import PostDetailContent from '@/feature/post/components/PostDetailContent';
import PostDetailError from '@/feature/post/components/PostDetailError';
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

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error={res.message} />
      </div>
    );
  }

  if (!res.data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error="게시글 정보를 불러올 수 없습니다." />
      </div>
    );
  }

  const meRes = await fetchMeServer();
  const isOwner = meRes.ok && meRes.data.id === res.data.authorId;

  return (
    <div className="min-h-screen bg-slate-50">
      <PostDetailHeader post={res.data} isOwner={isOwner} />
      <PostDetailContent post={res.data} />
    </div>
  );
}
