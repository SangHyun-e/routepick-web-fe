import PostWriteSkeleton from '@/feature/post/write/components/PostWriteSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PostWriteSkeleton />
    </div>
  );
}
