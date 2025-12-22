'use client';

import type { PostResponse } from '@/feature/post/types';

interface PostDetailContentProps {
  post: PostResponse;
}

export default function PostDetailContent({ post }: PostDetailContentProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <div className="prose prose-sm max-w-none rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-base leading-relaxed whitespace-pre-wrap text-slate-900">
          {post.content}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
