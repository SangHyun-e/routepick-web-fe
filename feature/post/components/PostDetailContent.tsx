import type { PostResponse } from '@/feature/post/types';
import { Map, TagIcon } from 'lucide-react';

interface PostDetailContentProps {
  post: PostResponse;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasHtmlTag(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export default function PostDetailContent({ post }: PostDetailContentProps) {
  const hasCoordinates: boolean = post.latitude != null && post.longitude != null;
  const hasTags: boolean = Array.isArray(post.tags) && post.tags.length > 0;
  const rawContent = post.content ?? '';
  const htmlContent = hasHtmlTag(rawContent)
    ? rawContent
    : escapeHtml(rawContent).replace(/\r?\n/g, '<br />');

  return (
    <div className="py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div
          className="post-editor-content prose prose-slate max-w-none whitespace-pre-wrap break-words prose-p:whitespace-pre-wrap prose-p:my-0 prose-p:leading-[1.6]"
          dangerouslySetInnerHTML={{ __html: htmlContent ?? '' }}
        />

        {(hasCoordinates || hasTags) && (
          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            {hasCoordinates && (
              <div className="flex items-start gap-3">
                <Map className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
                <div className="text-sm">
                  <p className="font-medium text-slate-700">위치 좌표</p>
                  <p className="mt-1 text-slate-600">
                    위도: {post.latitude}, 경도: {post.longitude}
                  </p>
                </div>
              </div>
            )}

            {hasTags && (
              <div className="flex items-start gap-3">
                <TagIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
