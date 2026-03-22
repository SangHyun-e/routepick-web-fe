'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { searchPlaces } from '../api/searchPlaces';
import type { Place } from '../types/place';

type PlaceSearchInputProps = {
  label: string;
  placeholder: string;
  helperText?: string;
  query: string;
  selectedPlace: Place | null;
  onQueryChange: (value: string) => void;
  onSelectPlace: (place: Place) => void;
  selectedLabel?: string;
};

export default function PlaceSearchInput({
  label,
  placeholder,
  helperText,
  query,
  selectedPlace,
  onQueryChange,
  onSelectPlace,
  selectedLabel,
}: PlaceSearchInputProps) {
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || (selectedPlace && trimmed === selectedPlace.name)) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequest = (requestId.current += 1);
    const handler = setTimeout(async () => {
      setLoading(true);
      setError(null);

      const response = await searchPlaces(trimmed);
      if (requestId.current !== currentRequest) {
        return;
      }

      setLoading(false);
      setHasSearched(true);

      if (!response.ok) {
        setResults([]);
        setError(response.message);
        return;
      }

      setResults(response.data.results);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, selectedPlace]);

  const handleSelect = useCallback(
    (place: Place) => {
      onSelectPlace(place);
      onQueryChange(place.name);
      setResults([]);
      setHasSearched(false);
      setError(null);
    },
    [onSelectPlace, onQueryChange],
  );

  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
      </div>
      <input
        className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      {selectedPlace ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold">{selectedLabel ?? '선택된 장소'}:</span>{' '}
          {selectedPlace.name}
          {selectedPlace.address ? ` · ${selectedPlace.address}` : ''}
        </div>
      ) : null}

      {loading ? <p className="text-xs text-slate-400">검색 중...</p> : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      {!loading && !error && hasSearched && results.length === 0 ? (
        <p className="text-xs text-slate-400">검색 결과가 없습니다.</p>
      ) : null}

      {results.length > 0 ? (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              className="flex w-full flex-col gap-1 border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-600 last:border-b-0 hover:bg-slate-50"
              onClick={() => handleSelect(place)}
            >
              <span className="text-sm font-semibold text-slate-800">{place.name}</span>
              <span>{place.address}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
