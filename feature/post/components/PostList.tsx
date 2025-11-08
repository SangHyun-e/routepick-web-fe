import PostListItem from '@/feature/post/components/PostListItem';
import type { PostListItemResponse } from '@/feature/post/types';

type PostListProps = {
  items: PostListItemResponse[];
};

export default function PostList({ items }: PostListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <span className="text-lg">✨</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">아직 게시글이 없어요</p>
            <p className="mt-1 text-xs text-slate-500">첫 글의 주인공이 되어 보세요!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <PostListItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
