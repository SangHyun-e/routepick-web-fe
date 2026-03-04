'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

import { fetchPosts } from '@/feature/post/api';
import PostList from '@/feature/post/list/PostList';
import type { PostListItemResponse } from '@/feature/post/types';
import WeatherWidget from '@/feature/weather/components/WeatherWidget';

export default function Home() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [popularPosts, setPopularPosts] = useState<PostListItemResponse[]>([]);
  const [latestPosts, setLatestPosts] = useState<PostListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [popularRes, latestRes] = await Promise.all([
        fetchPosts(0, 5, 'popular'),
        fetchPosts(0, 5, 'latest'),
      ]);

      if (!mounted) return;
      setPopularPosts(popularRes.ok ? popularRes.data.content : []);
      setLatestPosts(latestRes.ok ? latestRes.data.content : []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = useCallback(() => {
    const keyword = searchInput.trim();
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    router.push(params.toString() ? `/posts?${params.toString()}` : '/posts');
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

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
        <WeatherWidget />
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                오늘의 드라이브 코스를 찾아보세요
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                지역·테마 키워드로 빠르게 추천 코스를 검색할 수 있습니다.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-80">
              <div className="relative">
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="예: 한강, 야경, 힐링"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute inset-y-0 right-3 my-2 rounded-full px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                  >
                    초기화
                  </button>
                ) : null}
              </div>
              <button
                onClick={handleSearch}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                코스 검색
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link
              href="/posts"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>코스 둘러보기</span>
              <span className="text-xs text-slate-400 transition group-hover:text-slate-500">
                바로가기 →
              </span>
            </Link>
            <Link
              href="/posts/write"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>코스 공유하기</span>
              <span className="text-xs text-slate-400 transition group-hover:text-slate-500">
                바로가기 →
              </span>
            </Link>
            <Link
              href="/me"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>내 활동 보기</span>
              <span className="text-xs text-slate-400 transition group-hover:text-slate-500">
                바로가기 →
              </span>
            </Link>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">드라이브 코스 추천</h2>
              <p className="mt-1 text-sm text-slate-500">
                출발지와 도착지를 입력해 추천 코스를 받아보세요.
              </p>
            </div>
            <Link
              href="/drive"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              추천받기
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">이번 주 인기 코스</h2>
          <p className="text-sm text-slate-500">좋아요와 조회수가 높은 코스를 모아봤어요.</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <PostList items={popularPosts} />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">최근 등록된 코스</h2>
          <p className="text-sm text-slate-500">새롭게 공유된 드라이브 코스를 확인하세요.</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <PostList items={latestPosts} />
          )}
        </section>
      </main>
    </div>
  );
}
