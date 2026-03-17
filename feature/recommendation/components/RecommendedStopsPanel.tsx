'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { CourseStop, RecommendedStop } from '../types/recommendation';
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

export default function RecommendedStopsPanel({
  stops,
  selectedStops,
  selectedStopName,
  variant = 'default',
  loading,
  onSelectStop,
  onUseStopAsDestination,
}: RecommendedStopsPanelProps) {
  const selectedNames = new Set(selectedStops.map((stop) => stop.name));
  const isEmptyVariant = variant === 'empty';
  const title = isEmptyVariant ? '이런 장소는 어떠세요?' : '추천 경유지';
  const subtitle = isEmptyVariant
    ? `추천 스팟 ${stops.length}곳을 준비했어요.`
    : `추천 ${stops.length}곳 · 선택 코스 ${selectedStops.length}곳`;

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
          const cardClass = isSelectedStop
            ? 'border-blue-500 bg-blue-50'
            : isCourseStop
                ? 'border-blue-200 bg-blue-50/60'
                : 'border-slate-200 bg-white hover:border-slate-300';
          const tagVariant = highlighted ? 'default' : 'secondary';

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
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
