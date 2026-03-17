'use client';

export default function DriveRecommendationEmpty() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 shadow-sm sm:p-6">
      <p className="text-base font-semibold text-slate-900">조건에 맞는 추천 코스를 찾지 못했어요</p>
      <p className="mt-2 text-sm text-slate-500">
        테마나 출발지/도착지 위치를 바꿔 다시 시도해보세요.
      </p>
    </section>
  );
}
