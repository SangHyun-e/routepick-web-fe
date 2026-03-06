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

export interface CourseRecommendationSaveRequest {
  origin: string;
  destination: string;
  theme: CourseTheme;
  routeSummary: string;
  explanation: string;
  stops: CourseStop[];
}

export interface CourseRecommendationSaveResponse extends CourseRecommendationSaveRequest {
  id: number;
  createdAt: string;
}

export interface CourseCurationResponse {
  course_title: string;
  vibe_summary: string;
  route_details: {
    start: string;
    stopover: string;
    destination: string;
  };
  drive_info: {
    duration: string;
    difficulty: string;
    best_time: string;
  };
  curator_tips: string[];
}
