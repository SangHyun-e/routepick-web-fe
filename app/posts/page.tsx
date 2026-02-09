'use client';

import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPosts } from '@/feature/post/api';
import PostList from '@/feature/post/list/PostList';
import Pagination from '@/feature/post/list/Pagination';
import PostSortSelect from '@/feature/post/components/PostSortSelect';
import type { PostListItemResponse, PaginatedResponse, PostSortOption } from '@/feature/post/types';
import { ChevronRight } from 'lucide-react';

export default function Page() {
  const [data, setData] = useState<PaginatedResponse<PostListItemResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOption, setSortOption] = useState<PostSortOption>('latest');
  const searchParams = useSearchParams();
  const keywordParam = searchParams.get('keyword') ?? '';
  const [searchInput, setSearchInput] = useState(keywordParam);
  const pageSize = 20;

  const router = useRouter();

  useEffect(() => {
    setSearchInput(keywordParam);
    setCurrentPage(0);
  }, [keywordParam]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const keyword = keywordParam.trim();
      const res = await fetchPosts(currentPage, pageSize, sortOption, {
        keyword: keyword || undefined,
      });
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
  }, [currentPage, keywordParam, sortOption]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSortChange = useCallback((sort: PostSortOption) => {
    setSortOption(sort);
    setCurrentPage(0);
  }, []);

  const handleWriteClick = useCallback(() => {
    router.push('/posts/write');
  }, [router]);

  const handleSearch = useCallback(() => {
    const keyword = searchInput.trim();
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    const query = params.toString();
    router.push(query ? `/posts?${query}` : '/posts');
  }, [router, searchInput]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

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
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">드라이브 코스</h1>
          <p className="text-sm text-slate-600">멋진 드라이브 코스를 공유하고 추천 받으세요</p>
        </div>

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="코스 이름이나 키워드로 검색"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute inset-y-0 right-3 my-2 rounded-full px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  초기화
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              검색
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <PostSortSelect value={sortOption} onChange={handleSortChange} />
            <button
              onClick={handleWriteClick}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-95"
            >
              <span>새 글 쓰기</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {keywordParam && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            &quot;{keywordParam}&quot; 검색 결과입니다.
          </div>
        )}

        <PostList items={data.content} />
        <p className="mt-4 text-xs text-slate-500">
          총 {data.totalElements}개의 드라이브 코스 중 {currentPage * pageSize + 1}~
          {Math.min((currentPage + 1) * pageSize, data.totalElements)} 보기
        </p>

        <Pagination
          currentPage={currentPage}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
