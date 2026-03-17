'use client';

import type { CourseSummary } from '../types/recommendation';
import {
  formatDistance,
  formatDuration,
  formatThemeLabel,
  summarizeStops,
} from '../utils/driveRecommendationFormat';

type DriveCourseCardProps = {
  course: CourseSummary;
  selected: boolean;
  onSelect: () => void;
};

export default function DriveCourseCard({ course, selected, onSelect }: DriveCourseCardProps) {
  const themeLabel = formatThemeLabel(course.theme);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:p-5 ${
        selected
          ? 'border-slate-900 bg-slate-900/5 shadow-lg ring-1 ring-slate-900/10'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {themeLabel}
            </span>
            {selected && (
              <span className="inline-flex rounded-full border border-slate-900 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-900">
                선택됨
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
              {course.title || '추천 드라이브 코스'}
            </h3>
            <p className="text-sm text-slate-600">
              {course.description || '드라이브에 어울리는 코스를 제안했어요.'}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          <p className="font-semibold text-slate-900">
            {formatDistance(course.totalDistanceKm)}
          </p>
          <p>{formatDuration(course.totalDurationMinutes)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">핵심 경유지</span>
        <span>{summarizeStops(course.stops, 2)}</span>
        <span className="text-slate-400">•</span>
        <span>총 {course.stops.length}곳</span>
      </div>
    </button>
  );
}
