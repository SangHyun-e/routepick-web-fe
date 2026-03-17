'use client';

import { useCallback, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getNearbyParking } from '../api/getNearbyParking';
import type { CourseStop, NearbyParkingItem, RecommendedStop } from '../types/recommendation';
import { buildStopKey, limitTags } from '../utils/driveRecommendationFormat';

type RecommendedStopsPanelProps = {
  stops: RecommendedStop[];
  selectedStops: CourseStop[];
  selectedStopName: string | null;
  variant?: 'default' | 'empty';
  loading?: boolean;
  onSelectStop: (stop: RecommendedStop) => void;
  onUseStopAsDestination?: (stop: RecommendedStop) => void;
};

type ParkingState = {
  open: boolean;
  loading: boolean;
  loaded: boolean;
  items: NearbyParkingItem[];
  error: string | null;
};

export default function RecommendedStopsPanel({
  stops,
  selectedStops,
  selectedStopName,
  variant = 'default',
  loading,
  onSelectStop,
  onUseStopAsDestination,
}: RecommendedStopsPanelProps) {
  const [parkingByStop, setParkingByStop] = useState<Record<string, ParkingState>>({});
  const selectedNames = new Set(selectedStops.map((stop) => stop.name));
  const isEmptyVariant = variant === 'empty';
  const title = isEmptyVariant ? '이런 장소는 어떠세요?' : '추천 경유지';
  const subtitle = isEmptyVariant
    ? `추천 스팟 ${stops.length}곳을 준비했어요.`
    : `추천 ${stops.length}곳 · 선택 코스 ${selectedStops.length}곳`;

  const handleToggleParking = useCallback(
    async (stop: RecommendedStop) => {
      const key = buildStopKey(stop);
      const current = parkingByStop[key];

      if (current?.open) {
        setParkingByStop((prev) => ({
          ...prev,
          [key]: { ...current, open: false },
        }));
        return;
      }

      if (current?.loaded) {
        setParkingByStop((prev) => ({
          ...prev,
          [key]: { ...current, open: true },
        }));
        return;
      }

      setParkingByStop((prev) => ({
        ...prev,
        [key]: {
          open: true,
          loading: true,
          loaded: false,
          items: [],
          error: null,
        },
      }));

      const result = await getNearbyParking(stop.lat, stop.lng);
      setParkingByStop((prev) => ({
        ...prev,
        [key]: {
          open: true,
          loading: false,
          loaded: true,
          items: result.ok ? result.data : [],
          error: result.ok ? null : result.message ?? '근처 주차장 정보를 불러오지 못했어요.',
        },
      }));
    },
    [parkingByStop],
  );

  const formatDistance = useCallback((distanceMeters: number) => {
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
      return '거리 정보 없음';
    }
    return `${Math.round(distanceMeters)}m`;
  }, []);

  if (stops.length === 0) {
    return (
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-5 text-sm text-slate-500">
          지도에 표시할 추천 장소가 아직 없어요.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 p-5">
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 pt-0">
        {stops.map((stop) => {
          const tags = limitTags(stop.tags, 3);
          const isSelectedStop = stop.name === selectedStopName;
          const isCourseStop = selectedNames.has(stop.name);
          const highlighted = isSelectedStop || isCourseStop;
          const typeLabel = stop.type || '드라이브 스팟';
          const parkingKey = buildStopKey(stop);
          const parkingState = parkingByStop[parkingKey];
          const parkingOpen = parkingState?.open ?? false;
          const parkingLoading = parkingState?.loading ?? false;
          const cardClass = isSelectedStop
            ? 'border-blue-500 bg-blue-50'
            : isCourseStop
                ? 'border-blue-200 bg-blue-50/60'
                : 'border-slate-200 bg-white hover:border-slate-300';
          const tagVariant = highlighted ? 'default' : 'secondary';
          const parkingButtonLabel = parkingOpen ? '주차장 닫기' : '근처 주차장 보기';

          return (
            <Card key={buildStopKey(stop)} className={`rounded-xl border ${cardClass}`}>
              <CardContent className="space-y-3 p-4">
                <button
                  type="button"
                  onClick={() => onSelectStop(stop)}
                  className="w-full text-left"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{stop.name}</p>
                      <p className="text-xs text-slate-500">{typeLabel}</p>
                    </div>
                    {highlighted && (
                      <Badge variant="outline" className="text-[10px]">
                        {isSelectedStop ? '선택 스팟' : '선택 코스'}
                      </Badge>
                    )}
                  </div>
                </button>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={`${stop.name}-${tag}`} variant={tagVariant}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  {typeof stop.stayMinutes === 'number' && stop.stayMinutes > 0 ? (
                    <span>체류 약 {stop.stayMinutes}분</span>
                  ) : (
                    <span>지도에서 위치를 확인해 보세요.</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {onUseStopAsDestination ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onUseStopAsDestination(stop)}
                      disabled={loading}
                    >
                      이곳으로 추천받기
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleParking(stop)}
                    disabled={parkingLoading}
                  >
                    {parkingLoading ? '불러오는 중...' : parkingButtonLabel}
                  </Button>
                </div>
                {parkingOpen && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    {parkingLoading ? (
                      <p>근처 주차장 정보를 불러오는 중...</p>
                    ) : parkingState?.error ? (
                      <p className="text-slate-500">근처 주차장 정보를 찾지 못했어요.</p>
                    ) : parkingState?.items.length ? (
                      <ul className="space-y-2">
                        {parkingState.items.map((parking) => (
                          <li key={`${parking.name}-${parking.address}`}>
                            <p className="text-sm font-semibold text-slate-900">
                              {parking.name}
                            </p>
                            <p className="text-xs text-slate-500">{parking.address}</p>
                            <p className="text-xs text-slate-500">
                              {formatDistance(parking.distanceMeters)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">근처 주차장 정보를 찾지 못했어요.</p>
                    )}
                    {!parkingLoading && (
                      <p className="mt-2 text-[10px] text-slate-400">
                        주차 위치 정보는 참고용이에요.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
