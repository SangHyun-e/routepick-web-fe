'use client';

import type { CourseStop, RecommendedStop } from '../types/recommendation';
import { buildStopKey, limitTags } from '../utils/driveRecommendationFormat';

type RecommendedStopsPanelProps = {
  stops: RecommendedStop[];
  selectedStops: CourseStop[];
  selectedStopName: string | null;
  onSelectStop: (name: string) => void;
};

export default function RecommendedStopsPanel({
  stops,
  selectedStops,
  selectedStopName,
  onSelectStop,
}: RecommendedStopsPanelProps) {
  const selectedNames = new Set(selectedStops.map((stop) => stop.name));

  if (stops.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        지도에 표시할 경유지가 아직 없어요.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold text-slate-900">추천 경유지</h3>
      <p className="mt-1 text-xs text-slate-500">
        추천 {stops.length}곳 · 선택 코스 {selectedStops.length}곳
      </p>

      <ul className="mt-4 grid gap-3">
        {stops.map((stop) => {
          const tags = limitTags(stop.tags, 3);
          const isSelectedStop = stop.name === selectedStopName;
          const isCourseStop = selectedNames.has(stop.name);
          const highlighted = isCourseStop || isSelectedStop;
          const typeLabel = stop.type || '드라이브 스팟';
          const highlightClass = isSelectedStop
            ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200'
            : isCourseStop
                ? 'border-blue-400 bg-blue-50/60'
                : 'border-slate-200 hover:border-slate-300';
          const tagClass = isSelectedStop
            ? 'bg-blue-100 text-blue-700'
            : isCourseStop
                ? 'bg-blue-50 text-blue-700'
                : 'bg-slate-100 text-slate-600';
          const typeClass = highlighted ? 'text-blue-700' : 'text-slate-500';
          return (
            <li key={buildStopKey(stop)}>
              <button
                type="button"
                onClick={() => onSelectStop(stop.name)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${highlightClass}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{stop.name}</p>
                    <p className={`text-xs ${typeClass}`}>{typeLabel}</p>
                  </div>
                  {highlighted && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isSelectedStop
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {isSelectedStop ? '선택 스팟' : '선택 코스'}
                    </span>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={`${stop.name}-${tag}`}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${tagClass}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {typeof stop.stayMinutes === 'number' && stop.stayMinutes > 0 && (
                  <p className="mt-2 text-xs text-slate-500">체류 약 {stop.stayMinutes}분</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
