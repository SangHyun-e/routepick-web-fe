'use client';

import { useEffect, useState } from 'react';
import type { PostResponse } from '@/feature/post/types';
import { fetchPost } from '@/feature/post/api';
import { useRouter } from 'next/navigation';

type PageProps = {
  params: { id: string };
};

export default function PostDetailPage({ params }: PageProps) {
  const router = useRouter();
  const id = Number(params.id);

  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError('잘못된 게시글 ID입니다.');
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      const res = await fetchPost(id);

      if (!mounted) return;

      if (!res.ok) {
        // 여기서만 res.message 사용 → 타입 에러 안 남
        setError(res.message ?? '게시글을 불러오지 못했습니다.');
        setPost(null);
      } else if (res.data) {
        setPost(res.data);
        setError(null);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  // 1) 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="mb-6 h-8 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mb-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2) 에러 or 데이터 없음
  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p className="mb-2 font-medium">게시글을 불러오지 못했습니다.</p>
            <p>{error ?? '알 수 없는 오류가 발생했습니다.'}</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              onClick={() => router.push('/posts')}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3) 정상 렌더링
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <button
          type="button"
          className="mb-4 text-xs text-slate-500 hover:text-slate-700"
          onClick={() => router.back()}
        >
          ← 뒤로가기
        </button>

        <h1 className="mb-3 text-3xl font-bold text-slate-900">{post.title}</h1>

        <div className="mb-6 text-xs text-slate-500">
          <span>{post.region ?? '지역 정보 없음'}</span>
          <span className="mx-2">·</span>
          <span>{new Date(post.createdAt).toLocaleString('ko-KR')}</span>
          <span className="mx-2">·</span>
          <span>조회 {post.viewCount}</span>
          <span className="mx-2">·</span>
          <span>좋아요 {post.likeCount}</span>
        </div>

        <article className="prose prose-sm max-w-none rounded-2xl bg-white p-6 whitespace-pre-wrap shadow-sm">
          {post.content}
        </article>
      </div>
    </div>
  );
}
