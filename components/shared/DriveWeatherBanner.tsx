'use client';

import { useEffect, useState } from 'react';

import { fetchDriveWeatherMessage } from '@/feature/weather/api';
import type { DriveWeatherResponse } from '@/feature/weather/types';

const FALLBACK_LOCATION = { lat: 37.5665, lng: 126.978 };
const FALLBACK_MESSAGE = '🙌 날씨 정보를 불러오지 못했어요. 그래도 안전운전!';

export default function DriveWeatherBanner() {
  const [weatherInfo, setWeatherInfo] = useState<DriveWeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherUsedFallback, setWeatherUsedFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    const applyResult = (result: DriveWeatherResponse, usedFallbackLocation: boolean) => {
      if (!mounted) return;
      setWeatherInfo(result);
      setWeatherUsedFallback(usedFallbackLocation);
      setWeatherLoading(false);
    };

    const fetchWeather = async (lat: number, lng: number, usedFallbackLocation: boolean) => {
      const response = await fetchDriveWeatherMessage(lat, lng, usedFallbackLocation);
      if (!mounted) return;

      if (response.ok) {
        applyResult(response.data, response.data.usedFallbackLocation);
      } else {
        applyResult(
          {
            message: FALLBACK_MESSAGE,
            temperature: null,
            precipitationType: null,
            skyStatus: null,
            windSpeed: null,
            usedFallbackLocation,
          },
          usedFallbackLocation,
        );
      }
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      fetchWeather(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, true);
      return () => {
        mounted = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude, false);
      },
      () => {
        fetchWeather(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, true);
      },
      { timeout: 5000, maximumAge: 600000 },
    );

    return () => {
      mounted = false;
    };
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
  const weatherTags = [temperatureLabel, skyLabel, precipitationLabel, windLabel].filter(
    (value): value is string => Boolean(value),
  );
  const weatherIcon = getWeatherIcon(
    weatherInfo?.precipitationType ?? null,
    weatherInfo?.skyStatus ?? null,
    weatherInfo?.windSpeed ?? null,
  );
  const weatherMessage = weatherLoading
    ? '날씨 정보를 불러오는 중이에요.'
    : (weatherInfo?.message ?? FALLBACK_MESSAGE);

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 lg:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span className="text-lg" aria-hidden>
              {weatherIcon}
            </span>
            <span>{weatherMessage}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
              {weatherLabel}
            </span>
            {weatherTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function mapSkyLabel(value: number): string {
  switch (value) {
    case 1:
      return '하늘 맑음';
    case 3:
      return '구름 많음';
    case 4:
      return '하늘 흐림';
    default:
      return '하늘 정보 없음';
  }
}

function mapPrecipitationLabel(value: number): string {
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
      return '강수 정보 없음';
  }
}

function getWeatherIcon(
  precipitationType: number | null,
  skyStatus: number | null,
  windSpeed: number | null,
): string {
  if (precipitationType != null) {
    if ([3, 7, 2, 6].includes(precipitationType)) return '❄️';
    if ([1, 5, 2, 6].includes(precipitationType)) return '🌧️';
  }
  if (windSpeed != null && windSpeed >= 10) {
    return '💨';
  }
  if (skyStatus === 1) return '☀️';
  if (skyStatus === 3) return '⛅️';
  if (skyStatus === 4) return '☁️';
  return '🚗';
}
