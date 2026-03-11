'use client';

import Link from 'next/link';
import { useCallback, useState, type KeyboardEvent } from 'react';

import { curateCourse, recommendCourse, saveRecommendation } from '@/feature/course/api';
import type {
  CourseCurationResponse,
  CourseRecommendationResponse,
  CourseTheme,
} from '@/feature/course/types';
import { searchPlaces } from '@/feature/place/api';
import type { KakaoPlaceDocument } from '@/feature/place/types';
import { toast } from 'sonner';

const THEME_OPTIONS: CourseTheme[] = ['야경', '바다', '산', '카페', '맛집', '와인딩'];

export default function DrivePage() {
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [themeInput, setThemeInput] = useState<CourseTheme>('야경');
  const [originResults, setOriginResults] = useState<KakaoPlaceDocument[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [originError, setOriginError] = useState<string | null>(null);
  const [originSelected, setOriginSelected] = useState<KakaoPlaceDocument | null>(null);
  const [destinationResults, setDestinationResults] = useState<KakaoPlaceDocument[]>([]);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [destinationSelected, setDestinationSelected] = useState<KakaoPlaceDocument | null>(null);
  const [recommendation, setRecommendation] = useState<CourseRecommendationResponse | null>(null);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [recommendSaving, setRecommendSaving] = useState(false);
  const [curation, setCuration] = useState<CourseCurationResponse | null>(null);
  const [curationLoading, setCurationLoading] = useState(false);
  const [curationError, setCurationError] = useState<string | null>(null);
  const [curationRequiresLogin, setCurationRequiresLogin] = useState(false);

  const handleOriginSearch = useCallback(async () => {
    const keyword = originInput.trim();
    if (!keyword) {
      setOriginError('출발지를 입력한 뒤 검색해주세요.');
      return;
    }
    setOriginLoading(true);
    setOriginError(null);
    const result = await searchPlaces(keyword);
    setOriginLoading(false);
    if (!result.ok) {
      setOriginResults([]);
      setOriginError(result.message ?? '출발지 검색에 실패했습니다.');
      return;
    }
    setOriginResults(result.data.documents ?? []);
  }, [originInput]);

  const handleDestinationSearch = useCallback(async () => {
    const keyword = destinationInput.trim();
    if (!keyword) {
      setDestinationError('도착지를 입력한 뒤 검색해주세요.');
      return;
    }
    setDestinationLoading(true);
    setDestinationError(null);
    const result = await searchPlaces(keyword);
    setDestinationLoading(false);
    if (!result.ok) {
      setDestinationResults([]);
      setDestinationError(result.message ?? '도착지 검색에 실패했습니다.');
      return;
    }
    setDestinationResults(result.data.documents ?? []);
  }, [destinationInput]);

  const handleOriginSelect = useCallback((place: KakaoPlaceDocument) => {
    const label = place.roadAddressName || place.addressName || place.placeName;
    setOriginInput(label);
    setOriginSelected(place);
    setOriginResults([]);
    setOriginError(null);
  }, []);

  const handleDestinationSelect = useCallback((place: KakaoPlaceDocument) => {
    const label = place.roadAddressName || place.addressName || place.placeName;
    setDestinationInput(label);
    setDestinationSelected(place);
    setDestinationResults([]);
    setDestinationError(null);
  }, []);

  const handleRecommend = useCallback(async () => {
    const origin = originInput.trim();
    const destination = destinationInput.trim();

    if (!origin || !destination) {
      setRecommendError('출발지와 도착지를 모두 입력해주세요.');
      return;
    }

    setRecommendLoading(true);
    setRecommendError(null);
    setCuration(null);
    setCurationError(null);
    setCurationRequiresLogin(false);

    const result = await recommendCourse({
      origin,
      destination,
      theme: themeInput,
      maxStops: 3,
      maxDetourKm: 10,
    });

    if (result.ok) {
      setRecommendation(result.data);
      setCuration(null);
      setCurationError(null);
    } else {
      setRecommendation(null);
      setCuration(null);
      setCurationError(null);
      setRecommendError(result.message ?? '추천 결과를 불러오지 못했습니다.');
    }

    setRecommendLoading(false);
  }, [destinationInput, originInput, themeInput]);

  const handleOriginKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleOriginSearch();
      }
    },
    [handleOriginSearch],
  );

  const handleDestinationKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleDestinationSearch();
      }
    },
    [handleDestinationSearch],
  );

  const handleSaveRecommendation = useCallback(async () => {
    if (!recommendation) {
      toast.error('저장할 추천 결과가 없습니다.');
      return;
    }
    if (recommendSaving) return;

    setRecommendSaving(true);
    const result = await saveRecommendation({
      origin: originInput.trim(),
      destination: destinationInput.trim(),
      theme: themeInput,
      routeSummary: recommendation.routeSummary,
      explanation: recommendation.explanation,
      stops: recommendation.stops,
    });
    setRecommendSaving(false);

    if (!result.ok) {
      if (result.status === 401) {
        toast.error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        return;
      }
      toast.error(result.message ?? '추천 코스 저장에 실패했습니다.');
      return;
    }

    toast.success('추천 코스를 저장했습니다.');
  }, [destinationInput, originInput, recommendation, recommendSaving, themeInput]);

  const handleCuration = useCallback(async () => {
    if (!recommendation) {
      toast.error('추천 코스를 먼저 생성해주세요.');
      return;
    }
    if (curationLoading) return;

    setCurationLoading(true);
    setCurationError(null);
    setCurationRequiresLogin(false);

    const result = await curateCourse({
      origin: originInput.trim(),
      destination: destinationInput.trim(),
      theme: themeInput,
      routeSummary: recommendation.routeSummary,
      explanation: recommendation.explanation,
      stops: recommendation.stops,
    });

    if (result.ok) {
      setCuration(result.data);
    } else {
      if (result.status === 401) {
        setCuration(null);
        setCurationRequiresLogin(true);
        setCurationError('로그인 후 크루저 큐레이션을 이용해주세요.');
        toast.error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        setCurationLoading(false);
        return;
      }
      setCuration(null);
      setCurationError(result.message ?? '크루저 큐레이션을 불러오지 못했습니다.');
    }

    setCurationLoading(false);
  }, [curationLoading, destinationInput, originInput, recommendation, themeInput]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">드라이브 코스 추천</h1>
            <p className="text-sm text-slate-500">
              출발지와 도착지를 입력하면 테마에 맞는 코스를 제안해요.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={originInput}
                  onChange={(event) => {
                    setOriginInput(event.target.value);
                    setOriginSelected(null);
                  }}
                  onKeyDown={handleOriginKeyDown}
                  placeholder="출발지 (예: 서울 강남역)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={handleOriginSearch}
                  disabled={originLoading}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {originLoading ? '검색 중...' : '검색'}
                </button>
              </div>
              {originSelected ? (
                <p className="text-xs text-slate-500">선택됨: {originSelected.placeName}</p>
              ) : null}
              {originError ? <p className="text-xs text-rose-500">{originError}</p> : null}
              {originResults.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  {originResults.slice(0, 5).map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleOriginSelect(place)}
                      className="w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-900">{place.placeName}</p>
                      <p className="text-xs text-slate-500">
                        {place.roadAddressName || place.addressName}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={destinationInput}
                  onChange={(event) => {
                    setDestinationInput(event.target.value);
                    setDestinationSelected(null);
                  }}
                  onKeyDown={handleDestinationKeyDown}
                  placeholder="도착지 (예: 양평 두물머리)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={handleDestinationSearch}
                  disabled={destinationLoading}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {destinationLoading ? '검색 중...' : '검색'}
                </button>
              </div>
              {destinationSelected ? (
                <p className="text-xs text-slate-500">선택됨: {destinationSelected.placeName}</p>
              ) : null}
              {destinationError ? (
                <p className="text-xs text-rose-500">{destinationError}</p>
              ) : null}
              {destinationResults.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  {destinationResults.slice(0, 5).map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleDestinationSelect(place)}
                      className="w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-900">{place.placeName}</p>
                      <p className="text-xs text-slate-500">
                        {place.roadAddressName || place.addressName}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={themeInput}
              onChange={(event) => setThemeInput(event.target.value as CourseTheme)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            >
              {THEME_OPTIONS.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRecommend}
              disabled={recommendLoading}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {recommendLoading ? '추천 중...' : '코스 추천'}
            </button>
          </div>

          {recommendError ? <p className="text-sm text-rose-500">{recommendError}</p> : null}
        </section>

        {recommendation ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">추천 경로</p>
                <p className="text-sm text-slate-500">{recommendation.routeSummary}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://map.kakao.com/?sName=${encodeURIComponent(
                    originInput.trim(),
                  )}&eName=${encodeURIComponent(destinationInput.trim())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                >
                  지도 링크
                </a>
                <button
                  type="button"
                  onClick={handleSaveRecommendation}
                  disabled={recommendSaving}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {recommendSaving ? '저장 중...' : '코스로 저장'}
                </button>
                <button
                  type="button"
                  onClick={handleCuration}
                  disabled={curationLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {curationLoading ? '크루저 작성 중...' : '크루저 큐레이션'}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {recommendation.stops.map((stop) => (
                <div
                  key={`${stop.name}-${stop.x}-${stop.y}`}
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{stop.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{stop.category}</p>
                    <p className="mt-2 text-xs text-slate-600">{stop.address}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(stop.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                    >
                      지도 보기
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-line text-slate-600">
              {recommendation.explanation}
            </div>

            {curationError ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-rose-500">
                <p>{curationError}</p>
                {curationRequiresLogin ? (
                  <Link
                    href="/login"
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300"
                  >
                    로그인하기
                  </Link>
                ) : null}
              </div>
            ) : null}

            {curation ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    크루저 큐레이션
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">{curation.course_title}</h3>
                  <p className="text-sm text-slate-600">{curation.vibe_summary}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="text-xs font-semibold text-slate-500">경로 상세</p>
                    <p>출발: {curation.route_details.start}</p>
                    <p>경유: {curation.route_details.stopover}</p>
                    <p>도착: {curation.route_details.destination}</p>
                  </div>
                  <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="text-xs font-semibold text-slate-500">드라이브 정보</p>
                    <p>예상 소요: {curation.drive_info.duration}</p>
                    <p>난이도: {curation.drive_info.difficulty}</p>
                    <p>추천 출발: {curation.drive_info.best_time}</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="text-xs font-semibold text-slate-500">큐레이터 팁</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {curation.curator_tips.map((tip, index) => (
                      <li key={`${tip}-${index}`}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
