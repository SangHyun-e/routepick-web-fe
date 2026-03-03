export type CourseTheme = '야경' | '바다' | '산' | '카페' | '맛집';

export interface CourseRecommendationRequest {
  origin: string;
  destination: string;
  theme: CourseTheme;
  maxStops?: number;
  maxDetourKm?: number;
}

export interface CourseStop {
  name: string;
  address: string;
  x: number;
  y: number;
  category: string;
}

export interface CourseRecommendationResponse {
  stops: CourseStop[];
  routeSummary: string;
  explanation: string;
}
