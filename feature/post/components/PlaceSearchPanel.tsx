'use client';

import { useCallback, useState } from 'react';
import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { searchPlaces } from '@/feature/place/api';
import type { KakaoPlaceDocument } from '@/feature/place/types';

type Props = {
  onInsert: (place: KakaoPlaceDocument) => void;
  onApplyLocation: (place: KakaoPlaceDocument) => void;
};

export default function PlaceSearchPanel({ onInsert, onApplyLocation }: Props) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<KakaoPlaceDocument[]>([]);
  const [expanded, setExpanded] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setError('검색어를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await searchPlaces(trimmed);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setResults(res.data.documents ?? []);
    setExpanded(false);
  }, [keyword]);

  const visibleResults = expanded ? results : results.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">장소 검색</p>
          <p className="text-xs text-slate-500">카카오 로컬 검색으로 장소 정보를 찾습니다.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="예: 한강 공원, 성수 카페"
          className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? '검색 중...' : '검색'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {visibleResults.map((place) => (
            <div
              key={place.id}
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{place.placeName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {place.roadAddressName || place.addressName}
                  </p>
                  {place.categoryName && (
                    <p className="mt-1 text-xs text-slate-400">{place.categoryName}</p>
                  )}
                </div>
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => onInsert(place)}>
                  본문에 추가
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onApplyLocation(place)}>
                  위치 자동 입력
                </Button>
                {place.placeUrl && (
                  <a
                    href={place.placeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    카카오맵 링크
                  </a>
                )}
              </div>
            </div>
          ))}
          {results.length > 3 && (
            <div className="flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? '접기' : `더보기 (${results.length - 3})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
