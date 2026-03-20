'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import PlaceSearchInput from './PlaceSearchInput';
import RecommendationOptions from './RecommendationOptions';
import { useDriveRecommendations } from '../hooks/useDriveRecommendations';
import type { Place } from '../types/place';

const STOP_OPTIONS = [2, 3, 4];

const parseNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function RecommendationSearchForm() {
  const {
    fetchRecommendations,
    loading,
    destinationSelection,
    setDestinationSelection,
    setSelectedIncludeStops,
  } = useDriveRecommendations();
  const [originQuery, setOriginQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<Place | null>(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Place | null>(null);
  const [durationMinutes, setDurationMinutes] = useState('180');
  const [maxStops, setMaxStops] = useState('3');
  const [selectedTheme, setSelectedTheme] = useState('nature');
  const [locationLoading, setLocationLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const parsedDuration = useMemo(() => parseNumber(durationMinutes), [durationMinutes]);
  const parsedMaxStops = useMemo(() => parseNumber(maxStops), [maxStops]);

  useEffect(() => {
    if (!destinationSelection) {
      if (selectedDestination && destinationQuery === selectedDestination.name) {
        setSelectedDestination(null);
        setDestinationQuery('');
      }
      return;
    }

    if (
      selectedDestination &&
      selectedDestination.name === destinationSelection.name &&
      selectedDestination.lat === destinationSelection.lat &&
      selectedDestination.lng === destinationSelection.lng
    ) {
      return;
    }

    const nextDestination: Place = {
      id: 'recommendation-destination',
      name: destinationSelection.name,
      address: '추천 경유지',
      lat: destinationSelection.lat,
      lng: destinationSelection.lng,
    };
    setSelectedDestination(nextDestination);
    setDestinationQuery(destinationSelection.name);
  }, [destinationSelection, destinationQuery, selectedDestination]);

  const handleOriginQueryChange = useCallback(
    (value: string) => {
      setOriginQuery(value);
      setFormError(null);
      if (selectedOrigin && value !== selectedOrigin.name) {
        setSelectedOrigin(null);
      }
    },
    [selectedOrigin],
  );

  const handleDestinationQueryChange = useCallback(
    (value: string) => {
      setDestinationQuery(value);
      setFormError(null);
      if (selectedDestination && value !== selectedDestination.name) {
        setSelectedDestination(null);
        setDestinationSelection(null);
        setSelectedIncludeStops([]);
      }
    },
    [selectedDestination, setDestinationSelection, setSelectedIncludeStops],
  );

  const handleSelectDestination = useCallback(
    (place: Place) => {
      setSelectedDestination(place);
      setDestinationSelection({ name: place.name, lat: place.lat, lng: place.lng });
      setSelectedIncludeStops([]);
    },
    [setDestinationSelection, setSelectedIncludeStops],
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setFormError('현재 위치를 사용할 수 없습니다.');
      return;
    }

    setFormError(null);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLoading(false);
        const place: Place = {
          id: 'current-location',
          name: '내 위치',
          address: '현재 위치',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedOrigin(place);
        setOriginQuery(place.name);
      },
      () => {
        setLocationLoading(false);
        setFormError('현재 위치를 가져오지 못했습니다.');
      },
    );
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);
      setSelectedIncludeStops([]);

      if (!selectedOrigin) {
        setFormError('출발지를 검색 후 선택해주세요.');
        return;
      }

      if (!selectedDestination) {
        setFormError('도착지를 검색 후 선택해주세요.');
        return;
      }

      if (!selectedTheme) {
        setFormError('테마를 선택해주세요.');
        return;
      }

      if (durationMinutes.trim() && parsedDuration === undefined) {
        setFormError('기대 소요 시간을 숫자로 입력해주세요.');
        return;
      }

      if (!durationMinutes.trim()) {
        setFormError('기대 소요 시간을 입력해주세요.');
        return;
      }

      await fetchRecommendations({
        originLat: selectedOrigin.lat,
        originLng: selectedOrigin.lng,
        durationMinutes: parsedDuration,
        maxStops: parsedMaxStops,
        theme: selectedTheme,
        destinationLat: selectedDestination.lat,
        destinationLng: selectedDestination.lng,
      });
    },
    [
      selectedOrigin,
      selectedDestination,
      selectedTheme,
      durationMinutes,
      parsedDuration,
      fetchRecommendations,
      parsedMaxStops,
      selectedTheme,
      setSelectedIncludeStops,
    ],
  );

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">드라이브 경로를 알려주세요</h2>
        <p className="mt-1 text-sm text-slate-500">
          출발지와 도착지를 지정하면 맞춤 코스를 추천해드려요.
        </p>

        <div className="mt-4 grid gap-4">
          <PlaceSearchInput
            label="출발지 검색"
            placeholder="출발지 검색 (예: 서울 강남역)"
            helperText="검색 결과에서 출발지를 선택해 주세요."
            query={originQuery}
            selectedPlace={selectedOrigin}
            onQueryChange={handleOriginQueryChange}
            onSelectPlace={setSelectedOrigin}
            selectedLabel="선택된 출발지"
          />
          <PlaceSearchInput
            label="도착지 검색"
            placeholder="도착지 검색 (예: 한강공원, 남산타워)"
            helperText="검색 결과에서 도착지를 선택해 주세요."
            query={destinationQuery}
            selectedPlace={selectedDestination}
            onQueryChange={handleDestinationQueryChange}
            onSelectPlace={handleSelectDestination}
            selectedLabel="선택된 도착지"
          />
          {destinationSelection ? (
            <p className="text-xs text-slate-500">
              현재 도착지: {destinationSelection.name}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700"
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
            >
              내 위치로 시작
            </button>
            {locationLoading ? <span className="text-xs text-slate-400">위치 확인 중...</span> : null}
          </div>
        </div>
      </section>

      <RecommendationOptions selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">드라이브 기본 설정</h3>
        <p className="mt-1 text-sm text-slate-500">예상 시간과 정차 수를 입력해 주세요.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">기대 소요 시간 (분)</label>
            <input
              type="number"
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
              placeholder="예: 180"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              min={30}
              max={360}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">정차 수</label>
            <select
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
              value={maxStops}
              onChange={(event) => setMaxStops(event.target.value)}
            >
              {STOP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}곳
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {formError ? <p className="text-sm text-red-500">{formError}</p> : null}

      <button
        type="submit"
        className="h-11 rounded-lg bg-slate-900 text-sm font-semibold text-white disabled:bg-slate-400"
        disabled={loading || locationLoading}
      >
        {loading ? '추천 중...' : '코스 추천'}
      </button>
    </form>
  );
}
