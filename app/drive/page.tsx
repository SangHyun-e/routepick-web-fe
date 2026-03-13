'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';

import { curateCourse, recommendCourse, saveRecommendation } from '@/feature/course/api';
import type {
  CourseCurationResponse,
  CourseRecommendationResponse,
  DriveMood,
  DriveRouteStyle,
  DriveStopType,
} from '@/feature/course/types';
import { searchPlaces } from '@/feature/place/api';
import type { KakaoPlaceDocument } from '@/feature/place/types';
import { toast } from 'sonner';

const MOOD_OPTIONS: DriveMood[] = ['야경', '감성', '힐링', '한적한'];
const STOP_TYPE_OPTIONS: DriveStopType[] = ['분좋카', '맛집', '전망대', '산책'];
const ROUTE_STYLE_OPTIONS: DriveRouteStyle[] = ['해안길', '산길', '와인딩', '무난한'];
const STOP_COUNT_OPTIONS = [2, 3, 4] as const;
type StopCountOption = (typeof STOP_COUNT_OPTIONS)[number];

export default function DrivePage() {
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<DriveMood[]>([]);
  const [selectedStopTypes, setSelectedStopTypes] = useState<DriveStopType[]>([]);
  const [selectedRouteStyles, setSelectedRouteStyles] = useState<DriveRouteStyle[]>([]);
  const [autoRecommend, setAutoRecommend] = useState(true);
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
  const [maxStopsInput, setMaxStopsInput] = useState<StopCountOption>(3);
  const [curation, setCuration] = useState<CourseCurationResponse | null>(null);
  const [curationLoading, setCurationLoading] = useState(false);
  const [curationError, setCurationError] = useState<string | null>(null);
  const [curationRequiresLogin, setCurationRequiresLogin] = useState(false);

  const preferenceSummary = useMemo(() => {
    if (autoRecommend) {
      return '서비스 추천';
    }

    const parts: string[] = [];
    if (selectedMoods.length > 0) {
      parts.push(`분위기: ${selectedMoods.join(', ')}`);
    }
    if (selectedStopTypes.length > 0) {
      parts.push(`들를 곳: ${selectedStopTypes.join(', ')}`);
    }
    if (selectedRouteStyles.length > 0) {
      parts.push(`길 스타일: ${selectedRouteStyles.join(', ')}`);
    }

    return parts.length === 0 ? '서비스 추천' : parts.join(' | ');
  }, [autoRecommend, selectedMoods, selectedRouteStyles, selectedStopTypes]);

  const saveThemeLabel = useMemo(() => {
    if (autoRecommend) {
      return '서비스 추천';
    }

    const labels = [
      ...selectedMoods,
      ...selectedStopTypes,
      ...selectedRouteStyles.map((style) => (style === '무난한' ? '무난한' : style)),
    ];

    if (labels.length === 0) {
      return '서비스 추천';
    }

    const summary = labels.join('/');
    return summary.length > 20 ? summary.slice(0, 20) : summary;
  }, [autoRecommend, selectedMoods, selectedRouteStyles, selectedStopTypes]);

  useEffect(() => {
    if (
      selectedMoods.length === 0 &&
      selectedStopTypes.length === 0 &&
      selectedRouteStyles.length === 0
    ) {
      setAutoRecommend(true);
    }
  }, [selectedMoods, selectedRouteStyles, selectedStopTypes]);

  const handleAutoRecommendToggle = useCallback(() => {
    setAutoRecommend((prev) => {
      const next = !prev;
      if (next) {
        setSelectedMoods([]);
        setSelectedStopTypes([]);
        setSelectedRouteStyles([]);
      }
      return next;
    });
  }, []);

  const toggleSelection = useCallback(
    <T extends string>(value: T, setter: Dispatch<SetStateAction<T[]>>) => {
      setAutoRecommend(false);
      setter((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
      );
    },
    [],
  );

  const chipClass = useCallback((selected: boolean) => {
    const base =
      'inline-flex h-8 items-center justify-center rounded-full border px-3.5 text-xs font-semibold transition';
    return selected
      ? `${base} border-slate-900 bg-slate-900 text-white shadow-sm`
      : `${base} border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50`;
  }, []);

  const autoChipClass = useCallback((selected: boolean) => {
    const base =
      'inline-flex h-9 items-center justify-center rounded-full border px-4 text-xs font-semibold transition';
    return selected
      ? `${base} border-slate-900 bg-slate-900 text-white shadow-sm`
      : `${base} border-dashed border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400`;
  }, []);

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
      moods: selectedMoods,
      stopTypes: selectedStopTypes,
      routeStyles: selectedRouteStyles,
      autoRecommend,
      maxStops: maxStopsInput,
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
  }, [
    autoRecommend,
    destinationInput,
    maxStopsInput,
    originInput,
    selectedMoods,
    selectedRouteStyles,
    selectedStopTypes,
  ]);

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
      theme: saveThemeLabel,
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
  }, [destinationInput, originInput, recommendation, recommendSaving, saveThemeLabel]);

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
      preferenceSummary,
      moods: selectedMoods,
      stopTypes: selectedStopTypes,
      routeStyles: selectedRouteStyles,
      autoRecommend,
      routeSummary: recommendation.routeSummary,
      explanation: recommendation.explanation,
      stops: recommendation.stops,
      extraStops: 2,
    });

    if (result.ok) {
      setCuration(result.data);
    } else {
      if (result.status === 401) {
        setCuration(null);
        setCurationRequiresLogin(true);
        setCurationError('로그인 후 AI 추천 더보기를 이용해주세요.');
        toast.error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        setCurationLoading(false);
        return;
      }
      setCuration(null);
      setCurationError(result.message ?? 'AI 추천 더보기를 불러오지 못했습니다.');
    }

    setCurationLoading(false);
  }, [
    autoRecommend,
    curationLoading,
    destinationInput,
    originInput,
    preferenceSummary,
    recommendation,
    selectedMoods,
    selectedRouteStyles,
    selectedStopTypes,
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">드라이브 코스 추천</h1>
            <p className="text-sm text-slate-500">
              출발지와 도착지를 입력하면 조건에 맞는 코스를 제안해요.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">출발지</p>
              <div className="flex gap-2">
                <input
                  value={originInput}
                  onChange={(event) => {
                    setOriginInput(event.target.value);
                    setOriginSelected(null);
                  }}
                  onKeyDown={handleOriginKeyDown}
                  placeholder="출발지 (예: 서울 강남역)"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={handleOriginSearch}
                  disabled={originLoading}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {originLoading ? '검색 중...' : '검색'}
                </button>
              </div>
              {originSelected ? (
                <p className="text-[11px] text-slate-500">선택됨: {originSelected.placeName}</p>
              ) : null}
              {originError ? <p className="text-xs text-rose-500">{originError}</p> : null}
              {originResults.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm">
                  {originResults.slice(0, 5).map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleOriginSelect(place)}
                      className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-white"
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
              <p className="text-xs font-semibold text-slate-500">도착지</p>
              <div className="flex gap-2">
                <input
                  value={destinationInput}
                  onChange={(event) => {
                    setDestinationInput(event.target.value);
                    setDestinationSelected(null);
                  }}
                  onKeyDown={handleDestinationKeyDown}
                  placeholder="도착지 (예: 양평 두물머리)"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={handleDestinationSearch}
                  disabled={destinationLoading}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {destinationLoading ? '검색 중...' : '검색'}
                </button>
              </div>
              {destinationSelected ? (
                <p className="text-[11px] text-slate-500">
                  선택됨: {destinationSelected.placeName}
                </p>
              ) : null}
              {destinationError ? (
                <p className="text-xs text-rose-500">{destinationError}</p>
              ) : null}
              {destinationResults.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm">
                  {destinationResults.slice(0, 5).map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleDestinationSelect(place)}
                      className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-white"
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
        </section>

        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">추천 옵션</h2>
              <p className="text-sm text-slate-500">분위기와 들를 곳, 길 스타일을 조합해보세요.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {preferenceSummary}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">서비스 추천</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAutoRecommendToggle}
                  className={autoChipClass(autoRecommend)}
                >
                  전부 맡길게요
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                아무 조건을 고르지 않으면 서비스 추천이 적용됩니다.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">분위기</p>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleSelection(mood, setSelectedMoods)}
                    className={chipClass(selectedMoods.includes(mood))}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">들를 곳</p>
              <div className="flex flex-wrap gap-2">
                {STOP_TYPE_OPTIONS.map((stop) => (
                  <button
                    key={stop}
                    type="button"
                    onClick={() => toggleSelection(stop, setSelectedStopTypes)}
                    className={chipClass(selectedStopTypes.includes(stop))}
                  >
                    {stop}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">길 스타일</p>
              <div className="flex flex-wrap gap-2">
                {ROUTE_STYLE_OPTIONS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleSelection(style, setSelectedRouteStyles)}
                    className={chipClass(selectedRouteStyles.includes(style))}
                  >
                    {style === '무난한' ? '무난한 코스' : style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold text-slate-500">정차 수</p>
              <select
                value={maxStopsInput}
                onChange={(event) =>
                  setMaxStopsInput(Number(event.target.value) as StopCountOption)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm transition outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              >
                {STOP_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count === 2
                      ? '정차 2곳 (짧게)'
                      : count === 3
                        ? '정차 3곳 (기본)'
                        : '정차 4곳 (길게)'}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleRecommend}
              disabled={recommendLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {recommendLoading ? '추천 중...' : '코스 추천'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">정차 수가 많을수록 코스 길이가 길어집니다.</p>
          {recommendError ? <p className="text-sm text-rose-500">{recommendError}</p> : null}
        </section>

        {recommendation ? (
          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">추천 경로</p>
                <p className="text-base font-semibold text-slate-900">
                  {recommendation.routeSummary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://map.kakao.com/?sName=${encodeURIComponent(
                    originInput.trim(),
                  )}&eName=${encodeURIComponent(destinationInput.trim())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  지도 링크
                </a>
                <button
                  type="button"
                  onClick={handleSaveRecommendation}
                  disabled={recommendSaving}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {recommendSaving ? '저장 중...' : '코스로 저장'}
                </button>
                <button
                  type="button"
                  onClick={handleCuration}
                  disabled={curationLoading}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {curationLoading ? 'AI 추천 생성 중...' : 'AI 추천 더보기'}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {recommendation.stops.map((stop) => (
                <div
                  key={`${stop.name}-${stop.x}-${stop.y}`}
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">{stop.name}</p>
                    <p className="text-xs text-slate-500">{stop.category}</p>
                    <p className="text-xs text-slate-600">{stop.address}</p>
                  </div>
                  <div className="mt-4">
                    <a
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(stop.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      지도 보기
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {recommendation.relaxation?.relaxed ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">{recommendation.relaxation.message}</p>
                {recommendation.relaxation.conditions.length > 0 ? (
                  <div className="mt-2 space-y-1 text-xs text-amber-900">
                    {recommendation.relaxation.conditions.map((condition) => (
                      <p key={`${condition.category}-${condition.value}`}>
                        {condition.relaxed ? '✖' : '✔'} {condition.category}: {condition.value}
                        {condition.relaxed ? ' (완화)' : ''}
                      </p>
                    ))}
                    {recommendation.relaxation.searchRadiusRelaxed ? (
                      <p>
                        ✖ 검색 반경:{' '}
                        {recommendation.relaxation.searchRadiusMeters.toLocaleString()}m (확대)
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-line text-slate-600">
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
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    AI 추천 더보기
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

                {curation.extra_stops && curation.extra_stops.length > 0 ? (
                  <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="text-xs font-semibold text-slate-500">AI 추가 추천</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {curation.extra_stops.map((stop) => (
                        <div
                          key={`${stop.name}-${stop.x}-${stop.y}`}
                          className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-900">{stop.name}</p>
                            <p className="text-[11px] text-slate-500">{stop.category}</p>
                            <p className="text-[11px] text-slate-600">{stop.address}</p>
                          </div>
                          <div className="mt-3">
                            <a
                              href={`https://map.kakao.com/link/search/${encodeURIComponent(stop.name)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300"
                            >
                              지도 보기
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
