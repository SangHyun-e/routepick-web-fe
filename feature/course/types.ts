export type DriveMood = '야경' | '감성' | '힐링' | '한적한';
export type DriveStopType = '분좋카' | '맛집' | '전망대' | '산책';
export type DriveRouteStyle = '해안길' | '산길' | '와인딩' | '무난한';

export interface CourseRecommendationRequest {
  origin: string;
  destination: string;
  moods?: DriveMood[];
  stopTypes?: DriveStopType[];
  routeStyles?: DriveRouteStyle[];
  autoRecommend?: boolean;
  maxStops?: 2 | 3 | 4;
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
  relaxation: CourseRecommendationRelaxation;
}

export interface CourseRecommendationConditionStatus {
  category: string;
  value: string;
  relaxed: boolean;
}

export interface CourseRecommendationRelaxation {
  relaxed: boolean;
  message: string;
  conditions: CourseRecommendationConditionStatus[];
  searchRadiusMeters: number;
  searchRadiusRelaxed: boolean;
}

export interface CourseRecommendationSaveRequest {
  origin: string;
  destination: string;
  theme: string;
  totalDurationMinutes?: number | null;
  routeSummary: string;
  explanation: string;
  stops: CourseStop[];
}

export interface CourseRecommendationSaveResponse extends CourseRecommendationSaveRequest {
  id: number;
  createdAt: string;
}
