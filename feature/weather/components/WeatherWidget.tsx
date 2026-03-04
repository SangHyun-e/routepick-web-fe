'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { fetchDriveWeatherMessage } from '@/feature/weather/api';
import type { DriveWeatherResponse } from '@/feature/weather/types';

const FALLBACK_LOCATION = { lat: 37.5665, lng: 126.978 };
const FALLBACK_MESSAGE = '날씨 정보를 아직 못 불러왔어요.';

export default function WeatherWidget() {
  const [weatherInfo, setWeatherInfo] = useState<DriveWeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const mountedRef = useRef(true);

  const requestWeather = async (lat: number, lng: number, fallback: boolean) => {
    setWeatherLoading(true);
    setWeatherError(false);

    const response = await fetchDriveWeatherMessage(lat, lng, fallback);
    if (!mountedRef.current) return;

    if (response.ok) {
      setWeatherInfo(response.data);
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

  const hour = new Date().getHours();
  const locationLabel = weatherInfo?.usedFallbackLocation ? '서울 기준' : '현재 위치';
  const icon = getWeatherIcon(
    weatherInfo?.precipitationType ?? null,
    weatherInfo?.skyStatus ?? null,
    weatherInfo?.windSpeed ?? null,
    hour,
  );
  const title = weatherLoading
    ? '날씨 정보를 확인 중이에요'
    : weatherError
      ? '날씨 정보를 불러오지 못했어요'
      : buildTitle(weatherInfo?.precipitationType ?? null, weatherInfo?.skyStatus ?? null, hour);
  const description = weatherLoading
    ? '잠시만 기다려주세요.'
    : weatherInfo?.message ?? FALLBACK_MESSAGE;
  const meta = useMemo(
    () => buildMeta(weatherInfo, locationLabel),
    [weatherInfo, locationLabel],
  );

  return (
    <section className="rounded-xl border bg-gradient-to-r from-sky-50 to-indigo-50 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row">
        <div className="text-[36px] leading-none sm:text-[40px]" aria-hidden>
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted">{meta}</p>
        </div>
      </div>
    </section>
  );
}

function buildTitle(
  precipitationType: number | null,
  skyStatus: number | null,
  hour: number,
): string {
  if (precipitationType != null) {
    if ([3, 7, 2, 6].includes(precipitationType)) return '눈 오는 시간이에요';
    if ([1, 5, 2, 6].includes(precipitationType)) return '비가 오는 중이에요';
  }
  if (hour >= 20 || hour <= 5) {
    return skyStatus === 1 ? '맑은 밤이에요' : '밤 공기가 차분해요';
  }
  if (hour >= 6 && hour <= 10) {
    return skyStatus === 1 ? '상쾌한 아침이에요' : '아침 공기가 부드러워요';
  }
  if (hour >= 16 && hour <= 19) {
    return skyStatus === 1 ? '노을이 기대돼요' : '해 질 녘 분위기예요';
  }
  if (skyStatus === 1) return '화창한 낮이에요';
  if (skyStatus === 3) return '구름 많은 하늘이에요';
  if (skyStatus === 4) return '잔잔히 흐린 하늘이에요';
  return '오늘 날씨를 살펴볼게요';
}

function buildMeta(info: DriveWeatherResponse | null, locationLabel: string): string {
  const parts: string[] = [];
  if (info?.temperature != null) {
    parts.push(`${Math.round(info.temperature)}°C`);
  }
  if (info?.windSpeed != null) {
    parts.push(`바람 ${info.windSpeed.toFixed(1)}m/s`);
  }
  parts.push(locationLabel);
  return parts.join(' · ');
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
