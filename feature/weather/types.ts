export interface DriveWeatherResponse {
  message: string;
  temperature: number | null;
  precipitationType: number | null;
  skyStatus: number | null;
  windSpeed: number | null;
  usedFallbackLocation: boolean;
}
