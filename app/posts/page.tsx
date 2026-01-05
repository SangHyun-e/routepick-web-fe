'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchPosts } from '@/feature/post/api';
import PostList from '@/feature/post/list/PostList';
import Pagination from '@/feature/post/list/Pagination';
import type { PostListItemResponse, PaginatedResponse } from '@/feature/post/types';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [data, setData] = useState<PaginatedResponse<PostListItemResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await fetchPosts(currentPage, pageSize);
      if (!mounted) return;
      if (res.ok && res.data) {
        setData(res.data);
        setCurrentPage(res.data.number);
      } else {
        setData(null);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleWriteClick = useCallback(() => {
    router.push('/posts/write');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="h-12 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-slate-900">드라이브 코스</h1>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>목록을 불러오는 데 실패했습니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">드라이브 코스</h1>
          <p className="text-sm text-slate-600">멋진 드라이브 코스를 공유하고 추천 받으세요</p>
        </div>

        {/* Action Bar */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={handleWriteClick}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-95"
          >
            <span>새 글 쓰기</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Post List */}
        <PostList items={data.content} />
        <p className="mt-4 text-xs text-slate-500">
          총 {data.totalElements}개의 드라이브 코스 중 {currentPage * pageSize + 1}~
          {Math.min((currentPage + 1) * pageSize, data.totalElements)} 보기
        </p>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
