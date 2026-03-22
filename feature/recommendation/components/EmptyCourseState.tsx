'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { formatThemeLabel } from '../utils/driveRecommendationFormat';

type EmptyCourseStateProps = {
  durationMinutes?: number;
  theme?: string;
  maxStops?: number;
  hasDestination: boolean;
  loading?: boolean;
  onIncreaseDuration: () => void;
  onClearDestination: () => void;
  onRefresh: () => void;
};

export default function EmptyCourseState({
  durationMinutes,
  theme,
  maxStops,
  hasDestination,
  loading,
  onIncreaseDuration,
  onClearDestination,
  onRefresh,
}: EmptyCourseStateProps) {
  const durationLabel = typeof durationMinutes === 'number'
    ? `${durationMinutes}분`
    : '미설정';
  const themeLabel = theme ? formatThemeLabel(theme) : '테마 전체';
  const maxStopsLabel = typeof maxStops === 'number' ? `${maxStops}곳` : '미설정';

  return (
    <Card className="mx-auto w-full max-w-3xl border-dashed border-slate-200 bg-slate-50">
      <CardHeader className="text-center">
        <CardTitle className="text-lg text-slate-900">
          조건에 맞는 드라이브 코스를 찾지 못했어요.
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          주행 시간을 늘리거나 목적지를 조금 더 멀게 설정해 보세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
          <Badge variant="secondary">주행 시간 {durationLabel}</Badge>
          <Badge variant="secondary">테마 {themeLabel}</Badge>
          <Badge variant="secondary">정차 {maxStopsLabel}</Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onIncreaseDuration}
            disabled={loading}
          >
            시간 늘리기 (+30분)
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClearDestination}
            disabled={loading || !hasDestination}
          >
            목적지 없이 추천 받기
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onRefresh}
            disabled={loading}
          >
            다시 추천받기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
