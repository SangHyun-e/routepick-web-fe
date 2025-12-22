import PostDetailSkeleton from '@/feature/post/components/PostDetailSkeleton';

export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PostDetailSkeleton />
    </div>
  );
}
