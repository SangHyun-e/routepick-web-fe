import type { PostListItemResponse } from '@/feature/post/types';
import { Heart, Eye, MapPin, Clock, EyeOff, MessageCircle } from 'lucide-react';

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

function statusBadge(status: string | undefined) {
  const normalizedStatus = status || 'ACTIVE';

  switch (normalizedStatus) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          공개
        </span>
      );
    case 'HIDDEN':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          <EyeOff className="h-3 w-3" />
          숨김
        </span>
      );
    case 'DELETED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          삭제됨
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          공개
        </span>
      );
  }
}

export default function PostListItem({ item }: { item: PostListItemResponse }) {
  if (!item) {
    return null;
  }

  return (
    <li>
      <a
        href={`/posts/${item.id}`}
        className="group block px-6 py-4 transition-all hover:bg-slate-50"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left content */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="line-clamp-2 font-medium text-balance text-slate-900 transition-colors group-hover:text-blue-600">
              {item.title}
            </h3>

            {/* Meta info */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {statusBadge(item.status)}
              {item.region && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>{item.region}</span>
                </div>
              )}
              <span className="text-slate-300">·</span>
              <span>{item.authorNickname ?? '익명'}</span>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Right stats */}
          <div className="shrink-0 text-right text-xs text-slate-500 transition-colors group-hover:text-slate-900">
            <div className="flex items-center justify-end gap-1.5 font-medium">
              <Heart className="h-4 w-4 text-red-500" />
              <span>{item.likeCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 font-medium">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>{item.viewCount ?? 0}</span>
            </div>

            {/* 댓글 수 */}
            <div className="mt-1 flex items-center justify-end gap-1.5 font-medium">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span>{item.commentCount ?? 0}</span>
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}
