'use client';

type ThemeOption = {
  label: string;
  value: string;
  description: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    label: '자연 드라이브',
    value: 'nature',
    description: '전망대, 공원, 숲길 위주로 구성해요.',
  },
  {
    label: '야경 드라이브',
    value: 'night',
    description: '야경 포인트와 강변 드라이브를 중심으로 추천해요.',
  },
  {
    label: '카페 드라이브',
    value: 'cafe',
    description: '드라이브하기 좋은 대형 카페를 모았어요.',
  },
];

type RecommendationOptionsProps = {
  selectedTheme: string;
  onSelectTheme: (value: string) => void;
};

export default function RecommendationOptions({
  selectedTheme,
  onSelectTheme,
}: RecommendationOptionsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">테마 선택</h3>
      <p className="mt-1 text-sm text-slate-500">원하는 드라이브 테마를 하나 골라주세요.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const selected = selectedTheme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectTheme(option.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className={`mt-1 text-xs ${selected ? 'text-slate-200' : 'text-slate-500'}`}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
