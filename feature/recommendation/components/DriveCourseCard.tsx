'use client';

import { useCallback, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { saveRecommendation } from '@/feature/course/api';
import { postCourseExplain } from '../api/postCourseExplain';
import type { CourseExplainResponse, CourseSummary } from '../types/recommendation';
import {
  formatDistance,
  formatDuration,
  formatThemeLabel,
  summarizeStops,
} from '../utils/driveRecommendationFormat';

type DriveCourseCardProps = {
  course: CourseSummary;
  selected: boolean;
  onSelect: () => void;
  isLoggedIn: boolean;
  remainingCount: number | null;
  onRemainingChange: (remainingCount: number) => void;
  originLabel: string;
  destinationLabel: string;
};

const DEFAULT_REMAINING_COUNT = 3;

export default function DriveCourseCard({
  course,
  selected,
  onSelect,
  isLoggedIn,
  remainingCount,
  onRemainingChange,
  originLabel,
  destinationLabel,
}: DriveCourseCardProps) {
  const themeLabel = formatThemeLabel(course.theme);
  const router = useRouter();
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainResult, setExplainResult] = useState<CourseExplainResponse | null>(null);
  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(
    typeof course.courseId === 'number' ? course.courseId : null,
  );

  const remainingLabel = useMemo(
    () => remainingCount ?? DEFAULT_REMAINING_COUNT,
    [remainingCount],
  );
  const limitExceeded = remainingCount !== null && remainingCount <= 0;

  const routeSummary = useMemo(() => {
    const stopNames = course.stops
      .map((stop) => stop.name)
      .filter((name) => name && name.trim().length > 0);
    if (stopNames.length === 0) {
      return `${originLabel} → ${destinationLabel}`;
    }
    return `${originLabel} → ${stopNames.join(' → ')} → ${destinationLabel}`;
  }, [course.stops, destinationLabel, originLabel]);

  const saveStops = useMemo(
    () =>
      course.stops.map((stop) => ({
        name: stop.name || '알 수 없는 장소',
        address: stop.name || '주소 정보 없음',
        x: stop.lng,
        y: stop.lat,
        category: stop.type ?? '드라이브 스팟',
      })),
    [course.stops],
  );

  const handleLogin = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      router.push('/login');
    },
    [router],
  );

  const handleExplain = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      setExplainLoading(true);
      setExplainError(null);
      setExplainResult(null);

      let courseId = resolvedCourseId;
      if (!courseId) {
        if (saveStops.length === 0) {
          setExplainError('저장할 경유지가 없어 설명을 준비할 수 없어요.');
          setExplainLoading(false);
          return;
        }

        const saveResult = await saveRecommendation({
          origin: originLabel,
          destination: destinationLabel,
          theme: course.theme,
          totalDurationMinutes: course.totalDurationMinutes,
          routeSummary,
          explanation: course.description || '드라이브에 어울리는 코스를 제안했어요.',
          stops: saveStops,
        });

        if (!saveResult.ok) {
          setExplainError(saveResult.message ?? '코스를 저장하지 못했습니다.');
          setExplainLoading(false);
          return;
        }

        courseId = saveResult.data.id;
        setResolvedCourseId(courseId);
      }

      const result = await postCourseExplain(courseId);
      if (!result.ok) {
        if (result.message?.includes('오늘 AI 설명은 모두 사용했어요')) {
          onRemainingChange(0);
        }
        setExplainError(result.message ?? 'AI 설명을 불러오지 못했습니다.');
        setExplainLoading(false);
        return;
      }

      setExplainResult(result.data);
      onRemainingChange(result.data.remainingCount);
      setExplainLoading(false);
    },
    [course.courseId, onRemainingChange],
  );

  return (
    <div
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:p-5 ${
        selected
          ? 'border-slate-900 bg-slate-900/5 shadow-lg ring-1 ring-slate-900/10'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {themeLabel}
              </span>
              {selected && (
                <span className="inline-flex rounded-full border border-slate-900 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-900">
                  선택됨
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                {course.title || '추천 드라이브 코스'}
              </h3>
              <p className="text-sm text-slate-600">
                {course.description || '드라이브에 어울리는 코스를 제안했어요.'}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-semibold text-slate-900">
              {formatDistance(course.totalDistanceKm)}
            </p>
            <p>{formatDuration(course.totalDurationMinutes)}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">핵심 경유지</span>
          <span>{summarizeStops(course.stops, 2)}</span>
          <span className="text-slate-400">•</span>
          <span>총 {course.stops.length}곳</span>
        </div>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!isLoggedIn ? (
          <Button type="button" variant="outline" onClick={handleLogin}>
            로그인하고 설명 보기
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleExplain}
            disabled={limitExceeded || explainLoading}
            className="rounded-lg px-4 py-2"
          >
            {limitExceeded
              ? '오늘 AI 설명은 모두 사용했어요'
              : explainLoading
                  ? '설명 생성 중...'
                  : 'AI 코스 해설 보기'}
          </Button>
        )}
        {isLoggedIn && !limitExceeded && !explainLoading ? (
          <span className="text-xs text-slate-400">오늘 AI 해설 {remainingLabel}회 남았어요</span>
        ) : null}
      </div>

      {(explainLoading || explainError || explainResult) && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          {explainLoading ? (
            <p className="animate-pulse">AI 설명을 생성 중입니다...</p>
          ) : explainError ? (
            <p className="text-red-500">{explainError}</p>
          ) : explainResult ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                {explainResult.title}
              </p>
              <p>{explainResult.description}</p>
              <p className="text-xs text-slate-500">{explainResult.reason}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
