'use client';

import { useCallback, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { saveRecommendation } from '@/feature/course/api';
import { postCourseExplain } from '../api/postCourseExplain';
import { useDriveRecommendations } from '../hooks/useDriveRecommendations';
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
};

const DEFAULT_REMAINING_COUNT = 3;

export default function DriveCourseCard({
  course,
  selected,
  onSelect,
  isLoggedIn,
  remainingCount,
  onRemainingChange,
}: DriveCourseCardProps) {
  const themeLabel = formatThemeLabel(course.theme);
  const router = useRouter();
  const { lastQuery } = useDriveRecommendations();
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainResult, setExplainResult] = useState<CourseExplainResponse | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(
    typeof course.courseId === 'number' ? course.courseId : null,
  );

  const remainingLabel = useMemo(
    () => remainingCount ?? DEFAULT_REMAINING_COUNT,
    [remainingCount],
  );
  const limitExceeded = remainingCount !== null && remainingCount <= 0;
  const hasSaved = resolvedCourseId !== null;
  const saveDisabled = !selected || saveLoading || hasSaved;
  const saveButtonLabel = useMemo(() => {
    if (!selected) {
      return '선택 후 저장';
    }
    if (hasSaved) {
      return '저장됨';
    }
    if (saveLoading) {
      return '저장 중...';
    }
    return isLoggedIn ? '저장하기' : '로그인하고 저장';
  }, [hasSaved, isLoggedIn, saveLoading, selected]);

  const selectedStops = useMemo(
    () =>
      course.stops.map((stop) => ({
        name: stop.name || '알 수 없는 장소',
        lat: stop.lat,
        lng: stop.lng,
        type: stop.type ?? '드라이브 스팟',
        tags: stop.tags ?? [],
        stayMinutes: stop.stayMinutes ?? 0,
        viewScore: stop.viewScore ?? 0,
        driveSuitability: stop.driveSuitability ?? 0,
        segmentDistanceKm: stop.segmentDistanceKm ?? 0,
        segmentDurationMinutes: stop.segmentDurationMinutes ?? 0,
      })),
    [course.stops],
  );

  const includeStops = useMemo(() => {
    if (!lastQuery?.includeStops || lastQuery.includeStops.length === 0) {
      return [];
    }
    return lastQuery.includeStops.map((stop) => ({
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
    }));
  }, [lastQuery?.includeStops]);

  const explainText = useMemo(() => {
    if (!explainResult) {
      return undefined;
    }
    const chunks = [explainResult.description, explainResult.reason].filter(Boolean);
    return chunks.length > 0 ? chunks.join('\n') : undefined;
  }, [explainResult]);

  const handleLogin = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      router.push('/login');
    },
    [router],
  );

  const buildSavePayload = useCallback(() => {
    if (!lastQuery) {
      return null;
    }
    const {
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      durationMinutes,
      maxStops,
    } = lastQuery;
    if (destinationLat === undefined || destinationLng === undefined) {
      return null;
    }
    if (durationMinutes === undefined || maxStops === undefined) {
      return null;
    }
    if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) {
      return null;
    }
    if (!Number.isFinite(destinationLat) || !Number.isFinite(destinationLng)) {
      return null;
    }
    if (!Number.isFinite(durationMinutes) || !Number.isFinite(maxStops)) {
      return null;
    }
    if (!Number.isFinite(course.totalDistanceKm) || !Number.isFinite(course.totalDurationMinutes)) {
      return null;
    }
    if (selectedStops.length === 0) {
      return null;
    }

    const title = course.title?.trim() || '추천 드라이브 코스';
    const theme = course.theme?.trim() || '드라이브';
    const description = course.description?.trim() || '드라이브에 어울리는 코스를 제안했어요.';

    return {
      title,
      theme,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      durationMinutes,
      maxStops,
      totalDistanceKm: course.totalDistanceKm,
      totalDurationMinutes: course.totalDurationMinutes,
      description,
      explainText,
      selectedStops,
      includeStops: includeStops.length > 0 ? includeStops : undefined,
    };
  }, [course, explainText, includeStops, lastQuery, selectedStops]);

  const handleSave = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!selected || saveLoading || resolvedCourseId) {
        return;
      }
      if (!isLoggedIn) {
        router.push('/login');
        return;
      }

      const payload = buildSavePayload();
      if (!payload) {
        toast.error('추천 조건을 확인할 수 없어 저장할 수 없어요.');
        return;
      }

      setSaveLoading(true);
      const saveResult = await saveRecommendation(payload);
      if (!saveResult.ok) {
        if (saveResult.status === 401) {
          toast.error('로그인이 필요해요.');
          router.push('/login');
        } else {
          toast.error(saveResult.message ?? '코스를 저장하지 못했습니다.');
        }
        setSaveLoading(false);
        return;
      }

      setResolvedCourseId(saveResult.data.id);
      setSaveLoading(false);
      toast.success('코스를 저장했어요');
    },
    [buildSavePayload, isLoggedIn, resolvedCourseId, router, saveLoading, selected],
  );

  const handleExplain = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      setExplainLoading(true);
      setExplainError(null);
      setExplainResult(null);

      let courseId = resolvedCourseId;
      if (!courseId) {
        const payload = buildSavePayload();
        if (!payload) {
          setExplainError('추천 조건을 확인할 수 없어 설명을 준비할 수 없어요.');
          setExplainLoading(false);
          return;
        }

        const saveResult = await saveRecommendation(payload);

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
    [buildSavePayload, course.courseId, onRemainingChange, resolvedCourseId],
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
          <>
            <Button type="button" variant="outline" onClick={handleLogin}>
              로그인하고 설명 보기
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={saveDisabled}
            >
              {saveButtonLabel}
            </Button>
          </>
        ) : (
          <>
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
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={saveDisabled}
            >
              {saveButtonLabel}
            </Button>
          </>
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
