'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { CourseStop, RecommendedStop } from '../types/recommendation';

declare global {
  interface Window {
    kakao: any;
  }
}

type LatLng = {
  lat: number;
  lng: number;
};

type MarkerKind = 'origin' | 'destination' | 'recommended' | 'course' | 'selected';

type MarkerPoint = {
  key: string;
  label: string;
  position: LatLng;
  kind: MarkerKind;
};

type DriveRecommendationMapProps = {
  originLabel: string;
  destinationLabel: string;
  origin: LatLng | null;
  destination: LatLng | null;
  recommendedStops: RecommendedStop[];
  selectedStops: CourseStop[];
  selectedStopName: string | null;
};

type MapStatus = 'idle' | 'loading' | 'ready' | 'error';

const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '';
const SCRIPT_ID = 'kakao-map-sdk';

const MARKER_COLORS: Record<MarkerKind, { color: string; size: number; stroke?: string }> = {
  origin: { color: '#22c55e', size: 30 },
  destination: { color: '#ef4444', size: 30 },
  recommended: { color: '#94a3b8', size: 26 },
  course: { color: '#2563eb', size: 30 },
  selected: { color: '#1d4ed8', size: 36, stroke: '#1e3a8a' },
};

const MARKER_Z_INDEX: Record<MarkerKind, number> = {
  origin: 3,
  destination: 3,
  recommended: 1,
  course: 4,
  selected: 5,
};

function isValidLatLng(lat?: number | null, lng?: number | null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  return Math.abs(lat as number) <= 90 && Math.abs(lng as number) <= 180;
}

function buildMarkerKey(name: string, lat: number, lng: number) {
  return `${name}-${lat}-${lng}`;
}

export default function DriveRecommendationMap({
  originLabel,
  destinationLabel,
  origin,
  destination,
  recommendedStops,
  selectedStops,
  selectedStopName,
}: DriveRecommendationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapStatus, setMapStatus] = useState<MapStatus>('idle');

  const markerPoints = useMemo(() => {
    const points: MarkerPoint[] = [];
    const seen = new Set<string>();
    const selectedKeys = new Set(
      selectedStops
        .filter((stop) => isValidLatLng(stop.lat, stop.lng))
        .map((stop) => buildMarkerKey(stop.name, stop.lat, stop.lng)),
    );
    const selectedNames = new Set(selectedStops.map((stop) => stop.name));

    const addPoint = (point: MarkerPoint) => {
      if (seen.has(point.key)) {
        return;
      }
      seen.add(point.key);
      points.push(point);
    };

    if (origin && isValidLatLng(origin.lat, origin.lng)) {
      addPoint({
        key: `origin-${origin.lat}-${origin.lng}`,
        label: originLabel,
        position: origin,
        kind: 'origin',
      });
    }

    if (destination && isValidLatLng(destination.lat, destination.lng)) {
      addPoint({
        key: `destination-${destination.lat}-${destination.lng}`,
        label: destinationLabel,
        position: destination,
        kind: 'destination',
      });
    }

    recommendedStops.forEach((stop) => {
      if (!isValidLatLng(stop.lat, stop.lng)) {
        return;
      }
      const key = buildMarkerKey(stop.name, stop.lat, stop.lng);
      const isSelectedStop = selectedStopName === stop.name;
      const kind: MarkerKind = isSelectedStop
        ? 'selected'
        : selectedKeys.has(key) || selectedNames.has(stop.name)
            ? 'course'
            : 'recommended';

      addPoint({
        key,
        label: stop.name,
        position: { lat: stop.lat, lng: stop.lng },
        kind,
      });
    });

    selectedStops.forEach((stop) => {
      if (!isValidLatLng(stop.lat, stop.lng)) {
        return;
      }
      const key = buildMarkerKey(stop.name, stop.lat, stop.lng);
      const kind: MarkerKind = selectedStopName === stop.name ? 'selected' : 'course';
      addPoint({
        key,
        label: stop.name,
        position: { lat: stop.lat, lng: stop.lng },
        kind,
      });
    });

    return points;
  }, [origin, destination, originLabel, destinationLabel, recommendedStops, selectedStops, selectedStopName]);

  const selectedPosition = useMemo(() => {
    if (!selectedStopName) {
      return null;
    }
    const selectedPoint = markerPoints.find((point) => point.label === selectedStopName);
    return selectedPoint?.position ?? null;
  }, [markerPoints, selectedStopName]);

  useEffect(() => {
    if (!KAKAO_MAP_APP_KEY) {
      setMapStatus('error');
      return;
    }

    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(() => setMapStatus('ready'));
      return;
    }

    setMapStatus('loading');
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const handleError = () => setMapStatus('error');
    const handleLoad = () => {
      if (!window.kakao?.maps?.load) {
        setMapStatus('error');
        return;
      }
      window.kakao.maps.load(() => setMapStatus('ready'));
    };

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        handleLoad();
        return;
      }
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&autoload=false`;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      handleLoad();
    });
    script.addEventListener('error', handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapContainerRef.current || !window.kakao?.maps) {
      return;
    }

    if (!mapRef.current) {
      const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.9780);
      mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        level: 6,
      });
    }
  }, [mapStatus]);

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapRef.current || !window.kakao?.maps) {
      return;
    }

    const map = mapRef.current;
    map.relayout?.();
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (markerPoints.length === 0) {
      return;
    }

    const createMarkerImage = ({ color, size, stroke }: { color: string; size: number; stroke?: string }) => {
      const height = Math.round(size * 1.375);
      const strokeAttr = stroke
        ? `stroke='${stroke}' stroke-width='2' stroke-linejoin='round'`
        : '';
      const svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='32' height='44' viewBox='0 0 32 44'>
          <path d='M16 0C7.7 0 1 6.7 1 15c0 12.4 15 29 15 29s15-16.6 15-29C31 6.7 24.3 0 16 0z' fill='${color}' ${strokeAttr}/>
          <circle cx='16' cy='15' r='6' fill='white'/>
        </svg>
      `;
      const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      return new window.kakao.maps.MarkerImage(
        url,
        new window.kakao.maps.Size(size, height),
        { offset: new window.kakao.maps.Point(Math.round(size / 2), height) },
      );
    };

    const markerImages = new Map<MarkerKind, any>();
    (Object.keys(MARKER_COLORS) as MarkerKind[]).forEach((kind) => {
      markerImages.set(kind, createMarkerImage(MARKER_COLORS[kind]));
    });

    const bounds = new window.kakao.maps.LatLngBounds();

    markerPoints.forEach((point) => {
      const position = new window.kakao.maps.LatLng(point.position.lat, point.position.lng);
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        title: point.label,
        image: markerImages.get(point.kind),
        zIndex: MARKER_Z_INDEX[point.kind],
      });
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (markerPoints.length === 1) {
      map.setCenter(bounds.getSouthWest());
      map.setLevel(4);
    } else {
      map.setBounds(bounds, 60, 60, 60, 60);
    }
  }, [mapStatus, markerPoints]);

  useEffect(() => {
    if (!selectedPosition || mapStatus !== 'ready' || !mapRef.current || !window.kakao?.maps) {
      return;
    }

    const map = mapRef.current;
    const center = new window.kakao.maps.LatLng(selectedPosition.lat, selectedPosition.lng);
    map.panTo(center);
  }, [mapStatus, selectedPosition]);

  const hasCoordinates = markerPoints.length > 0;
  const statusMessage = mapStatus === 'error'
    ? '지도를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
    : !hasCoordinates
        ? '지도에 표시할 좌표가 없어요'
        : '지도를 준비하고 있어요';

  const highlightMessage = selectedStopName
    ? `선택 스팟: ${selectedStopName}`
    : selectedStops.length > 0
        ? `선택 코스 경유지 ${selectedStops.length}곳 강조`
        : recommendedStops.length > 0
            ? '추천 스팟을 확인해 보세요'
            : '표시할 장소가 없어요';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">추천 지도</h3>
          <p className="text-xs text-slate-500">선택한 코스의 경유지가 강조됩니다.</p>
        </div>
        <span className="text-xs text-slate-500">{highlightMessage}</span>
      </div>

      <div className="relative mt-4 h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-72 lg:h-[22rem]">
        <div ref={mapContainerRef} className="h-full w-full" />
        {mapStatus !== 'ready' || !hasCoordinates ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />출발지
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />도착지
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />선택 코스
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />추천 경유지
        </span>
      </div>
    </section>
  );
}
