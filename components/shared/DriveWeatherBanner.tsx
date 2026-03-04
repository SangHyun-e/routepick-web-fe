'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { fetchDriveWeatherMessage } from '@/feature/weather/api';
import type { DriveWeatherResponse } from '@/feature/weather/types';

const FALLBACK_LOCATION = { lat: 37.5665, lng: 126.978 };
const FALLBACK_MESSAGE = '날씨 정보를 아직 못 불러왔어요. 그래도 안전운전!';

export default function DriveWeatherBanner() {
  const [weatherInfo, setWeatherInfo] = useState<DriveWeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherUsedFallback, setWeatherUsedFallback] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [lastRequest, setLastRequest] = useState<{
    lat: number;
    lng: number;
    fallback: boolean;
  } | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const mountedRef = useRef(true);

  const requestWeather = async (lat: number, lng: number, fallback: boolean) => {
    setWeatherLoading(true);
    setWeatherError(false);
    setLastRequest({ lat, lng, fallback });

    const response = await fetchDriveWeatherMessage(lat, lng, fallback);
    if (!mountedRef.current) return;

    if (response.ok) {
      setWeatherInfo(response.data);
      setWeatherUsedFallback(response.data.usedFallbackLocation);
      setWeatherError(false);
      setWeatherLoading(false);
      return;
    }

    setWeatherInfo({
      message: FALLBACK_MESSAGE,
      temperature: null,
      precipitationType: null,
      skyStatus: null,
      windSpeed: null,
      usedFallbackLocation: fallback,
    });
    setWeatherUsedFallback(fallback);
    setWeatherError(true);
    setWeatherLoading(false);
  };

  useEffect(() => {
    mountedRef.current = true;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      requestWeather(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, true);
      return () => {
        mountedRef.current = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        requestWeather(pos.coords.latitude, pos.coords.longitude, false);
      },
      () => {
        requestWeather(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, true);
      },
      { timeout: 5000, maximumAge: 600000 },
    );

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weatherLabel = weatherUsedFallback ? '서울 기준' : '현재 위치 기준';
  const skyLabel = weatherInfo?.skyStatus != null ? mapSkyLabel(weatherInfo.skyStatus) : null;
  const precipitationLabel =
    weatherInfo?.precipitationType != null
      ? mapPrecipitationLabel(weatherInfo.precipitationType)
      : null;
  const temperatureLabel =
    weatherInfo?.temperature != null ? `기온 ${Math.round(weatherInfo.temperature)}°C` : null;
  const windLabel =
    weatherInfo?.windSpeed != null ? `풍속 ${weatherInfo.windSpeed.toFixed(1)}m/s` : null;
  const rawTags = [weatherLabel, skyLabel, precipitationLabel, windLabel];
  const weatherTags = rawTags.filter((value): value is string => Boolean(value));
  const hour = now.getHours();
  const timeLabel = useMemo(() => formatTime(now), [now]);
  const weatherIcon = getWeatherIcon(
    weatherInfo?.precipitationType ?? null,
    weatherInfo?.skyStatus ?? null,
    weatherInfo?.windSpeed ?? null,
    hour,
  );
  const weatherMessage = weatherLoading
    ? '날씨 정보를 불러오는 중이에요.'
    : weatherError
      ? '날씨 정보를 불러오지 못했어요.'
      : (weatherInfo?.message ?? FALLBACK_MESSAGE);
  const sublineParts = [] as string[];
  if (temperatureLabel) {
    sublineParts.push(`현재 ${temperatureLabel}`);
  }
  sublineParts.push(`${timeLabel} 기준`);
  const subline = sublineParts.join(' · ');

  const handleRetry = () => {
    if (!lastRequest) {
      requestWeather(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, true);
      return;
    }
    requestWeather(lastRequest.lat, lastRequest.lng, lastRequest.fallback);
  };

  return (
    <section className="bg-gradient-to-r from-slate-50 via-white to-slate-100/70">
      <div className="mx-auto max-w-6xl px-4 py-3 lg:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="text-2xl" aria-hidden>
              {weatherIcon}
            </span>
            <div className="min-w-0 space-y-1">
              {weatherLoading ? (
                <div className="h-4 w-56 animate-pulse rounded-full bg-slate-200" />
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
                  <span>{weatherMessage}</span>
                  {weatherError ? (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-500 transition hover:border-slate-300"
                      aria-label="날씨 다시 불러오기"
                    >
                      ↻
                    </button>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-slate-500">{subline}</p>
            </div>
          </div>
          <div className="flex w-full gap-2 overflow-x-auto text-xs text-slate-500 md:w-auto md:flex-wrap md:justify-end md:overflow-visible">
            {!weatherError
              ? weatherTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))
              : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function mapSkyLabel(value: number): string | null {
  switch (value) {
    case 1:
      return '맑음';
    case 3:
      return '구름 많음';
    case 4:
      return '흐림';
    default:
      return null;
  }
}

function mapPrecipitationLabel(value: number): string | null {
  switch (value) {
    case 0:
      return '강수 없음';
    case 1:
      return '비';
    case 2:
      return '비/눈';
    case 3:
      return '눈';
    case 5:
      return '빗방울';
    case 6:
      return '빗방울/눈날림';
    case 7:
      return '눈날림';
    default:
      return null;
  }
}

function getWeatherIcon(
  precipitationType: number | null,
  skyStatus: number | null,
  windSpeed: number | null,
  hour: number,
): string {
  if (precipitationType != null) {
    if ([3, 7, 2, 6].includes(precipitationType)) return '❄️';
    if ([1, 5, 2, 6].includes(precipitationType)) return '🌧️';
  }
  if (windSpeed != null && windSpeed >= 10) {
    return '💨';
  }
  if (hour >= 20 || hour <= 5) {
    return '🌙';
  }
  if (skyStatus === 1) return '☀️';
  if (skyStatus === 3) return '⛅️';
  if (skyStatus === 4) return '☁️';
  return '🚗';
}

function formatTime(now: Date): string {
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
