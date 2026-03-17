'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import DriveCourseList from './DriveCourseList';
import DriveRecommendationMap from './DriveRecommendationMap';
import RecommendedStopsPanel from './RecommendedStopsPanel';
import { fetchMe } from '@/feature/user/api';
import { useDriveRecommendations } from '../hooks/useDriveRecommendations';
import type { RecommendedStop } from '../types/recommendation';
import {
  formatDistance,
  formatDuration,
  formatThemeLabel,
  summarizeStops,
} from '../utils/driveRecommendationFormat';

export default function DriveRecommendationResult() {
  const { courses, recommendedStops, loading, error, lastQuery, fetchRecommendations } =
    useDriveRecommendations();
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [selectedStopName, setSelectedStopName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  const isEmpty = courses.length === 0;

  useEffect(() => {
    if (courses.length === 0) {
      setSelectedCourseIndex(0);
      setSelectedStopName(null);
      return;
    }
    setSelectedCourseIndex(0);
    setSelectedStopName(null);
  }, [courses]);

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
    setSelectedStopName(null);
  }, []);

  const handleSelectStop = useCallback((stop: RecommendedStop) => {
    setSelectedStopName(stop.name);
  }, []);

  const handleUseStopAsDestination = useCallback(
    async (stop: RecommendedStop) => {
      if (!lastQuery) {
        return;
      }

      await fetchRecommendations({
        ...lastQuery,
        destinationLat: stop.lat,
        destinationLng: stop.lng,
      });
      setSelectedStopName(stop.name);
    },
    [fetchRecommendations, lastQuery],
  );

  if (loading) {
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
    <section className="space-y-6 sm:space-y-8">
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
              originLabel={originLabel}
              destinationLabel={destinationLabel}
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
          selectedStopName={selectedStopName}
        />
        <RecommendedStopsPanel
          stops={recommendedStops}
          selectedStops={selectedStops}
          selectedStopName={selectedStopName}
          variant={isEmpty ? 'empty' : 'default'}
          loading={loading}
          onSelectStop={handleSelectStop}
          onUseStopAsDestination={lastQuery ? handleUseStopAsDestination : undefined}
        />
      </div>
    </section>
  );
}
