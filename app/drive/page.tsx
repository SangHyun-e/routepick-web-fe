'use client';

import { useCallback, useState } from 'react';

import { createDrivePlan } from '@/feature/drive/api';
import type { DrivePlanResponse, DriveTheme } from '@/feature/drive/types';

const THEME_OPTIONS: { value: DriveTheme; label: string }[] = [
  { value: 'HEALING', label: '힐링' },
  { value: 'WINDING', label: '와인딩' },
  { value: 'NIGHT_VIEW', label: '야경' },
  { value: 'CAFE', label: '카페' },
  { value: 'SEA', label: '바다' },
  { value: 'ETC', label: '기타' },
];

export default function DrivePlanPage() {
  const [startKeyword, setStartKeyword] = useState('');
  const [endKeyword, setEndKeyword] = useState('');
  const [theme, setTheme] = useState<DriveTheme>('HEALING');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [plan, setPlan] = useState<DrivePlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlan = useCallback(async () => {
    if (loading) return;

    const start = startKeyword.trim();
    const end = endKeyword.trim();

    if (!start || !end) {
      setError('출발지와 도착지를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createDrivePlan({
      startKeyword: start,
      endKeyword: end,
      theme,
      openNowOnly,
    });

    if (result.ok) {
      setPlan(result.data);
    } else {
      setPlan(null);
      setError(result.message ?? '추천 코스를 불러오지 못했습니다.');
    }

    setLoading(false);
  }, [endKeyword, loading, openNowOnly, startKeyword, theme]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">드라이브 코스 추천</h1>
            <p className="text-sm text-slate-500">
              출발지, 도착지, 테마를 입력하면 AI가 코스를 구성합니다.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={startKeyword}
              onChange={(event) => setStartKeyword(event.target.value)}
              placeholder="출발지 (예: 서울 강남역)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
            <input
              value={endKeyword}
              onChange={(event) => setEndKeyword(event.target.value)}
              placeholder="도착지 (예: 양평 두물머리)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as DriveTheme)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={openNowOnly}
                onChange={(event) => setOpenNowOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
              />
              현재 시간 기준(영업중 추정)
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleCreatePlan}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? '코스 생성 중...' : '코스 생성'}
            </button>
            <p className="text-xs text-slate-500">영업 여부는 외부 데이터 제약으로 추정입니다.</p>
          </div>

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        </section>

        {plan ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{plan.courseName}</h2>
              <p className="mt-1 text-sm text-slate-500">{plan.planReason}</p>
            </div>

            <ol className="space-y-4 border-l border-slate-200 pl-6">
              {plan.stops.map((stop) => (
                <li key={`${stop.order}-${stop.name}`} className="relative">
                  <span className="absolute top-4 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {stop.order}
                  </span>
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{stop.name}</p>
                      {stop.openNowEstimated ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          영업중 추정
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">{stop.address}</p>
                    <p className="text-xs text-slate-600">{stop.reason}</p>
                    {stop.placeUrl ? (
                      <a
                        href={stop.placeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                      >
                        장소 정보 보기
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </main>
    </div>
  );
}
