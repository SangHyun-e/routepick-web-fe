import { fetchPostServer } from '@/feature/post/api.server';
import PostDetailError from '@/feature/post/components/PostDetailError';
import PostEdit from '@/feature/post/components/PostEdit';
import { fetchMeServer } from '@/feature/user/api.server';
import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PostEditPage({ params }: PageProps) {
  const postId = Number(params.id);

  if (!Number.isFinite(postId)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError error="잘못된 게시글 ID입니다." />
      </div>
    );
  }

  const postRes = await fetchPostServer(postId);
  if (!postRes.ok || !postRes.data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PostDetailError
          error={postRes.ok ? '게시글 정보를 불러올 수 없습니다.' : postRes.message}
        />
      </div>
    );
  }

  const meRes = await fetchMeServer();
  if (!meRes.ok || !meRes.data) {
    redirect(`/login?from=${encodeURIComponent(`/posts/${postId}/edit`)}`);
  }

  const isOwner = meRes.data.id === postRes.data.authorId;
  if (!isOwner) {
    redirect(`/posts/${postId}`);
  }

  return <PostEdit post={postRes.data} />;
}
