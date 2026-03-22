'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import DriveCourseList from './DriveCourseList';
import DriveRecommendationMap from './DriveRecommendationMap';
import RecommendedStopsPanel from './RecommendedStopsPanel';
import { fetchMe } from '@/feature/user/api';
import { useDriveRecommendations } from '../hooks/useDriveRecommendations';
import type { RecommendedStop } from '../types/recommendation';
import {
  buildStopKey,
  formatDistance,
  formatDuration,
  formatThemeLabel,
  summarizeStops,
} from '../utils/driveRecommendationFormat';

export default function DriveRecommendationResult() {
  const {
    courses,
    recommendedStops,
    loading,
    error,
    lastQuery,
    fetchRecommendations,
    setDestinationSelection,
    selectedIncludeStops,
    setSelectedIncludeStops,
  } = useDriveRecommendations();
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [selectedStopKey, setSelectedStopKey] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [destinationSettingKey, setDestinationSettingKey] = useState<string | null>(null);
  const [includeSettingKey, setIncludeSettingKey] = useState<string | null>(null);
  const [includeSettingAction, setIncludeSettingAction] = useState<'add' | 'remove' | null>(null);
  const resultTopRef = useRef<HTMLDivElement | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmpty = courses.length === 0;
  const isRefreshing = loading && courses.length > 0;
  const includeStopKeys = useMemo(
    () => new Set(selectedIncludeStops.map((stop) => buildStopKey(stop))),
    [selectedIncludeStops],
  );
  const refreshMessage = useMemo(() => {
    if (includeSettingKey) {
      return includeSettingAction === 'remove'
        ? '선택한 장소를 제외하고 새 코스를 추천하는 중입니다...'
        : '선택한 장소를 포함해서 새 코스를 추천하는 중입니다...';
    }
    if (destinationSettingKey) {
      return '도착지를 반영해 새 코스를 추천하는 중입니다...';
    }
    return '새 코스를 추천하는 중입니다...';
  }, [destinationSettingKey, includeSettingAction, includeSettingKey]);

  useEffect(() => {
    if (courses.length === 0) {
      setSelectedCourseIndex(0);
      setSelectedStopKey(null);
      return;
    }
    setSelectedCourseIndex(0);
  }, [courses]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await fetchMe();
      if (!mounted) {
        return;
      }
      if (result.ok) {
        setCurrentUserId(result.data.id);
        setRemainingCount((prev) => prev ?? 3);
        return;
      }
      setCurrentUserId(null);
      setRemainingCount(null);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCourse = useMemo(() => {
    if (courses.length === 0) {
      return null;
    }
    return courses[selectedCourseIndex] ?? courses[0] ?? null;
  }, [courses, selectedCourseIndex]);

  const selectedStops = useMemo(() => selectedCourse?.stops ?? [], [selectedCourse]);

  const selectedSummary = useMemo(() => {
    if (!selectedCourse) {
      return null;
    }
    return {
      themeLabel: formatThemeLabel(selectedCourse.theme),
      distance: formatDistance(selectedCourse.totalDistanceKm),
      duration: formatDuration(selectedCourse.totalDurationMinutes),
      stopCount: selectedCourse.stops.length,
      stopSummary: summarizeStops(selectedCourse.stops, 3),
    };
  }, [selectedCourse]);

  const originLabel = useMemo(() => {
    if (!lastQuery) {
      return '출발지';
    }
    return '출발지';
  }, [lastQuery]);

  const destinationLabel = useMemo(() => {
    if (!lastQuery || !lastQuery.destinationLat || !lastQuery.destinationLng) {
      return '도착지';
    }
    return '도착지';
  }, [lastQuery]);

  const origin = useMemo(() => {
    if (!lastQuery) {
      return null;
    }
    if (typeof lastQuery.originLat !== 'number' || typeof lastQuery.originLng !== 'number') {
      return null;
    }
    if (!Number.isFinite(lastQuery.originLat) || !Number.isFinite(lastQuery.originLng)) {
      return null;
    }
    return { lat: lastQuery.originLat, lng: lastQuery.originLng };
  }, [lastQuery]);

  const destination = useMemo(() => {
    if (!lastQuery) {
      return null;
    }
    if (
      typeof lastQuery.destinationLat !== 'number' ||
      typeof lastQuery.destinationLng !== 'number'
    ) {
      return null;
    }
    if (!Number.isFinite(lastQuery.destinationLat) || !Number.isFinite(lastQuery.destinationLng)) {
      return null;
    }
    return { lat: lastQuery.destinationLat, lng: lastQuery.destinationLng };
  }, [lastQuery]);

  const handleSelectCourse = useCallback((index: number) => {
    setSelectedCourseIndex(index);
    setSelectedStopKey(null);
  }, []);

  const handleSelectStop = useCallback((stop: RecommendedStop) => {
    setSelectedStopKey(buildStopKey(stop));
  }, []);

  const handleUseStopAsDestination = useCallback(
    async (stop: RecommendedStop) => {
      if (!lastQuery) {
        return;
      }

      const stopKey = buildStopKey(stop);
      setSelectedStopKey(stopKey);
      setDestinationSettingKey(stopKey);

      const includeStopsPayload = selectedIncludeStops.map((includeStop) => ({
        name: includeStop.name,
        lat: includeStop.lat,
        lng: includeStop.lng,
      }));

      const success = await fetchRecommendations({
        ...lastQuery,
        destinationLat: stop.lat,
        destinationLng: stop.lng,
        includeStops: includeStopsPayload,
      });

      if (!success) {
        setDestinationSettingKey(null);
        return;
      }

      const message = `${stop.name}을 도착지로 설정하고 새 코스를 추천했어요.`;
      setDestinationSelection({ name: stop.name, lat: stop.lat, lng: stop.lng });
      setActionNotice(message);
      toast.success(message);
      setDestinationSettingKey(null);
      resultTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
      noticeTimeoutRef.current = setTimeout(() => {
        setActionNotice(null);
      }, 4000);
    },
    [fetchRecommendations, lastQuery, selectedIncludeStops, setDestinationSelection],
  );

  const handleIncludeStop = useCallback(
    async (stop: RecommendedStop) => {
      if (!lastQuery) {
        return;
      }

      const stopKey = buildStopKey(stop);
      if (includeStopKeys.has(stopKey)) {
        const previous = selectedIncludeStops;
        const nextIncludeStops = selectedIncludeStops.filter(
          (includeStop) => buildStopKey(includeStop) !== stopKey,
        );
        setSelectedStopKey(stopKey);
        setSelectedIncludeStops(nextIncludeStops);
        setIncludeSettingKey(stopKey);
        setIncludeSettingAction('remove');

        const includeStopsPayload = nextIncludeStops.map((includeStop) => ({
          name: includeStop.name,
          lat: includeStop.lat,
          lng: includeStop.lng,
        }));

        const success = await fetchRecommendations({
          ...lastQuery,
          includeStops: includeStopsPayload,
        });

        if (!success) {
          setSelectedIncludeStops(previous);
          setIncludeSettingKey(null);
          setIncludeSettingAction(null);
          return;
        }

        toast.success(`${stop.name}을 코스에서 제외했어요.`);
        setActionNotice('선택한 장소를 제외하고 새 코스를 추천했어요.');
        setIncludeSettingKey(null);
        setIncludeSettingAction(null);
        resultTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (noticeTimeoutRef.current) {
          clearTimeout(noticeTimeoutRef.current);
        }
        noticeTimeoutRef.current = setTimeout(() => {
          setActionNotice(null);
        }, 4000);
        return;
      }

      if (selectedIncludeStops.length >= 3) {
        toast.error('포함은 최대 3곳까지 가능해요.');
        return;
      }

      const previous = selectedIncludeStops;
      const nextIncludeStops = [...selectedIncludeStops, stop];
      setSelectedStopKey(stopKey);
      setSelectedIncludeStops(nextIncludeStops);
      setIncludeSettingKey(stopKey);
      setIncludeSettingAction('add');

      const includeStopsPayload = nextIncludeStops.map((includeStop) => ({
        name: includeStop.name,
        lat: includeStop.lat,
        lng: includeStop.lng,
      }));

      const success = await fetchRecommendations({
        ...lastQuery,
        includeStops: includeStopsPayload,
      });

      if (!success) {
        setSelectedIncludeStops(previous);
        setIncludeSettingKey(null);
        setIncludeSettingAction(null);
        return;
      }

      toast.success(`${stop.name}을 코스에 포함했어요`);
      setActionNotice('선택한 장소를 포함해서 새 코스를 추천했어요.');
      setIncludeSettingKey(null);
      setIncludeSettingAction(null);
      resultTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
      noticeTimeoutRef.current = setTimeout(() => {
        setActionNotice(null);
      }, 4000);
    },
    [
      fetchRecommendations,
      includeStopKeys,
      lastQuery,
      selectedIncludeStops,
      setSelectedIncludeStops,
    ],
  );

  if (loading && courses.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        추천 코스를 불러오는 중입니다...
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-red-500 shadow-sm">
        {error}
      </section>
    );
  }

  return (
    <section ref={resultTopRef} className="space-y-6 sm:space-y-8">
      {actionNotice ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {actionNotice}
        </div>
      ) : null}
      {isRefreshing ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          {refreshMessage}
        </div>
      ) : null}
      {!isEmpty && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">추천 코스</h2>
              <p className="text-sm text-slate-600">
                {selectedSummary
                  ? `${selectedSummary.themeLabel} 분위기에 맞춘 코스를 준비했어요.`
                  : '드라이브에 어울리는 코스를 골라봤어요.'}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-900">
                {courses.length === 1 ? '1개 코스 준비됨' : `${courses.length}개 코스`}
              </p>
              <p>현재 {selectedCourseIndex + 1}번째 코스</p>
            </div>
          </div>

          {selectedSummary && (
            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">총 거리</p>
                <p className="font-semibold text-slate-900">{selectedSummary.distance}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">예상 소요</p>
                <p className="font-semibold text-slate-900">{selectedSummary.duration}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">핵심 경유지</p>
                <p className="font-semibold text-slate-900">{selectedSummary.stopSummary}</p>
                <p className="text-xs text-slate-500">총 {selectedSummary.stopCount}곳</p>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500">
            코스를 선택하면 지도와 경유지 패널이 함께 강조됩니다.
          </p>

          <div className="mt-4">
            <DriveCourseList
              courses={courses}
              selectedIndex={selectedCourseIndex}
              onSelect={handleSelectCourse}
              isLoggedIn={currentUserId !== null}
              remainingCount={remainingCount}
              onRemainingChange={setRemainingCount}
            />
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DriveRecommendationMap
          originLabel={originLabel}
          destinationLabel={destinationLabel}
          origin={origin}
          destination={isEmpty ? null : destination}
          recommendedStops={recommendedStops}
          selectedStops={selectedStops}
          selectedStopKey={selectedStopKey}
          onSelectStop={handleSelectStop}
        />
        <RecommendedStopsPanel
          stops={recommendedStops}
          selectedStops={selectedStops}
          selectedIncludeStops={selectedIncludeStops}
          selectedStopKey={selectedStopKey}
          variant={isEmpty ? 'empty' : 'default'}
          loading={isRefreshing}
          includeSettingKey={includeSettingKey}
          includeSettingAction={includeSettingAction}
          destinationSettingKey={destinationSettingKey}
          onSelectStop={handleSelectStop}
          onIncludeStop={lastQuery ? handleIncludeStop : undefined}
          onUseStopAsDestination={lastQuery ? handleUseStopAsDestination : undefined}
        />
      </div>
    </section>
  );
}
