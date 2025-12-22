'use client';

import { ArrowLeft, MapPin, Clock, Heart, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PostResponse } from '@/feature/post/types';

interface PostDetailHeaderProps {
  post: PostResponse;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export default function PostDetailHeader({ post }: PostDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </button>

        <h1 className="mb-4 text-3xl font-bold text-balance text-slate-900">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {post.region && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{post.region}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>{formatDate(post.createdAt)}</span>
          </div>
          {post.authorNickname && (
            <>
              <span className="text-slate-300">·</span>
              <span>by {post.authorNickname}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="font-medium text-slate-700">{post.likeCount ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-slate-700">{post.viewCount ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
