'use client';

import RecommendationSearchForm from '@/feature/recommendation/components/RecommendationSearchForm';
import DriveRecommendationResult from '@/feature/recommendation/components/DriveRecommendationResult';
import { DriveRecommendationsProvider } from '@/feature/recommendation/hooks/useDriveRecommendations';

export default function DrivePage() {
  return (
    <DriveRecommendationsProvider>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
        <RecommendationSearchForm />
        <DriveRecommendationResult />
      </main>
    </DriveRecommendationsProvider>
  );
}
