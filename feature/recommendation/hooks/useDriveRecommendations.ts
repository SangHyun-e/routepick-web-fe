'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getDriveCourseRecommendations } from '../api/getDriveCourseRecommendations';
import type {
  CourseSummary,
  RecommendationQueryParams,
  RecommendedStop,
} from '../types/recommendation';

export type DestinationSelection = {
  name: string;
  lat: number;
  lng: number;
};

type DriveRecommendationState = {
  loading: boolean;
  error: string | null;
  courses: CourseSummary[];
  recommendedStops: RecommendedStop[];
  lastQuery: RecommendationQueryParams | null;
  fetchRecommendations: (params: RecommendationQueryParams) => Promise<boolean>;
  destinationSelection: DestinationSelection | null;
  setDestinationSelection: (selection: DestinationSelection | null) => void;
};

const DriveRecommendationsContext = createContext<DriveRecommendationState | null>(null);

function useDriveRecommendationsState(): DriveRecommendationState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [recommendedStops, setRecommendedStops] = useState<RecommendedStop[]>([]);
  const [lastQuery, setLastQuery] = useState<RecommendationQueryParams | null>(null);
  const [destinationSelection, setDestinationSelection] =
    useState<DestinationSelection | null>(null);

  const fetchRecommendations = useCallback(async (params: RecommendationQueryParams) => {
    setLoading(true);
    setError(null);
    setLastQuery(params);

    const result = await getDriveCourseRecommendations(params);
    if (!result.ok) {
      setCourses([]);
      setRecommendedStops([]);
      setError(result.message);
      setLoading(false);
      return false;
    }

    setCourses(result.data.courses ?? []);
    setRecommendedStops(result.data.recommendedStops ?? []);
    setLoading(false);
    return true;
  }, []);

  return useMemo(
    () => ({
      loading,
      error,
      courses,
      recommendedStops,
      lastQuery,
      fetchRecommendations,
      destinationSelection,
      setDestinationSelection,
    }),
    [
      loading,
      error,
      courses,
      recommendedStops,
      lastQuery,
      fetchRecommendations,
      destinationSelection,
      setDestinationSelection,
    ],
  );
}

export function DriveRecommendationsProvider({ children }: { children: ReactNode }) {
  const value = useDriveRecommendationsState();
  return createElement(DriveRecommendationsContext.Provider, { value }, children);
}

export function useDriveRecommendations() {
  const context = useContext(DriveRecommendationsContext);
  if (!context) {
    throw new Error('useDriveRecommendations must be used within DriveRecommendationsProvider');
  }
  return context;
}
