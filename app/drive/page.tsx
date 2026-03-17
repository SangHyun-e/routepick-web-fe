'use client';

import { useCallback, useMemo } from 'react';

import EmptyCourseState from '@/feature/recommendation/components/EmptyCourseState';
import RecommendationSearchForm from '@/feature/recommendation/components/RecommendationSearchForm';
import DriveRecommendationResult from '@/feature/recommendation/components/DriveRecommendationResult';
import {
  DriveRecommendationsProvider,
  useDriveRecommendations,
} from '@/feature/recommendation/hooks/useDriveRecommendations';

function DriveRecommendationContent() {
  const { courses, lastQuery, fetchRecommendations, loading, error } = useDriveRecommendations();

  const hasDestination = useMemo(() => {
    if (!lastQuery) {
      return false;
    }
    return (
      typeof lastQuery.destinationLat === 'number' && typeof lastQuery.destinationLng === 'number'
    );
  }, [lastQuery]);

  const showEmptyState = Boolean(lastQuery) && !loading && !error && courses.length === 0;

  const handleIncreaseDuration = useCallback(async () => {
    if (!lastQuery) {
      return;
    }
    const currentDuration =
      typeof lastQuery.durationMinutes === 'number' ? lastQuery.durationMinutes : 0;
    const nextDuration = Math.max(currentDuration + 30, 30);
    await fetchRecommendations({
      ...lastQuery,
      durationMinutes: nextDuration,
    });
  }, [fetchRecommendations, lastQuery]);

  const handleClearDestination = useCallback(async () => {
    if (!lastQuery) {
      return;
    }
    await fetchRecommendations({
      ...lastQuery,
      destinationLat: undefined,
      destinationLng: undefined,
    });
  }, [fetchRecommendations, lastQuery]);

  const handleRefresh = useCallback(async () => {
    if (!lastQuery) {
      return;
    }
    await fetchRecommendations(lastQuery);
  }, [fetchRecommendations, lastQuery]);

  return (
    <>
      <RecommendationSearchForm />
      {showEmptyState ? (
        <EmptyCourseState
          durationMinutes={lastQuery?.durationMinutes}
          theme={lastQuery?.theme}
          maxStops={lastQuery?.maxStops}
          hasDestination={hasDestination}
          loading={loading}
          onIncreaseDuration={handleIncreaseDuration}
          onClearDestination={handleClearDestination}
          onRefresh={handleRefresh}
        />
      ) : (
        <DriveRecommendationResult />
      )}
    </>
  );
}

export default function DrivePage() {
  return (
    <DriveRecommendationsProvider>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
        <DriveRecommendationContent />
      </main>
    </DriveRecommendationsProvider>
  );
}
