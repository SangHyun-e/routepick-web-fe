'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Route = {
  id: number;
  name: string;
  summary: string;
  duration: string;
  tags: string[];
};

const mockRoutes: Route[] = [
  {
    id: 1,
    name: '한강 야경 드라이브',
    summary: '한강변 야경을 느긋하게 감상하는 2시간 코스',
    duration: '2시간',
    tags: ['야경', '드라이브', '데이트'],
  },
  {
    id: 2,
    name: '서울 근교 당일치기 캠핑',
    summary: '근교 자연 캠핑장에서 힐링하며 보내는 하루',
    duration: '1일',
    tags: ['캠핑', '힐링', '자연'],
  },
  {
    id: 3,
    name: '카페 투어 in 성수',
    summary: '성수 일대의 인기 카페를 돌며 영감 얻기',
    duration: '반나절',
    tags: ['카페', '산책', '트렌디'],
  },
];

const quickLinks = [
  { href: '/planner', label: '여정 플래너' },
  { href: '/favorites', label: '즐겨찾기' },
  { href: '/community', label: '커뮤니티' },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoutes = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return mockRoutes;

    return mockRoutes.filter((route) => {
      const termMatchesName = route.name.toLowerCase().includes(normalized);
      const termMatchesTag = route.tags.some((tag) => tag.toLowerCase().includes(normalized));

      return termMatchesName || termMatchesTag;
    });
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">RoutePick 테스트 페이지</h1>
            <p className="mt-1 text-sm text-slate-500">
              UI 컴포넌트와 상태 변경을 빠르게 확인할 수 있는 임시 화면입니다.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            돌아가기
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                마음에 드는 루트를 찾아보세요
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                키워드나 태그를 입력하면 간단하게 필터링할 수 있습니다.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="예: 캠핑, 야경, 힐링"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-3 my-2 rounded-full px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  초기화
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400 transition group-hover:text-slate-500">
                  바로가기 →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">추천 루트 미리 보기</h2>
          <p className="text-sm text-slate-500">
            실제 데이터를 연동하기 전, 목업 정보를 활용해 UI를 점검할 수 있습니다.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredRoutes.map((route) => (
              <article
                key={route.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{route.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{route.summary}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                    소요 시간: {route.duration}
                  </span>
                  {route.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}

            {filteredRoutes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                조건에 맞는 루트가 없어요. 다른 키워드로 검색해볼까요?
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
