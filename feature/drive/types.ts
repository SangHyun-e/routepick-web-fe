export type DriveTheme = 'HEALING' | 'WINDING' | 'NIGHT_VIEW' | 'CAFE' | 'SEA' | 'ETC';

export interface DrivePlanRequest {
  startKeyword: string;
  endKeyword: string;
  theme: DriveTheme;
  openNowOnly?: boolean;
}

export interface DrivePlanStop {
  order: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeUrl: string;
  reason: string;
  openNowEstimated: boolean;
}

export interface DrivePlanResponse {
  courseName: string;
  planReason: string;
  stops: DrivePlanStop[];
}
