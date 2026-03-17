export type ScoreBreakdown = {
  themeScore: number;
  distanceScore: number;
  progressScore: number;
  reviewScore: number;
  penaltyScore: number;
  totalScore: number;
  penaltyReasons: string[];
};

export type CourseStop = {
  order: number;
  name: string;
  lat: number;
  lng: number;
  type: string | null;
  tags: string[];
  stayMinutes: number;
  viewScore: number;
  driveSuitability: number;
  segmentDistanceKm: number;
  segmentDurationMinutes: number;
};

export type CourseSummary = {
  courseId: number | null;
  region: string;
  theme: string;
  title: string;
  description: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  stops: CourseStop[];
};

export type RecommendedStop = {
  name: string;
  lat: number;
  lng: number;
  type: string | null;
  tags: string[];
  stayMinutes?: number;
  viewScore: number;
  driveSuitability: number;
};

export type RecommendationResponse = {
  requestId: string;
  originLat: number;
  originLng: number;
  departureTime: string;
  generatedAt: string;
  courses: CourseSummary[];
  recommendedStops: RecommendedStop[];
};

export type RecommendationQueryParams = {
  originLat: number;
  originLng: number;
  theme?: string;
  durationMinutes?: number;
  maxStops?: number;
  weatherAware?: boolean;
  destinationLat?: number;
  destinationLng?: number;
};

export type CourseExplainResponse = {
  title: string;
  description: string;
  reason: string;
  remainingCount: number;
};
