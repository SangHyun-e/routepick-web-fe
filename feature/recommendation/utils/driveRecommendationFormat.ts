import type { CourseStop, RecommendedStop } from '../types/recommendation';

const THEME_LABELS = new Map<string, string>([
  ['nature', '자연 드라이브'],
  ['night', '야경 드라이브'],
  ['cafe', '카페 드라이브'],
]);

export function formatDistance(distanceKm: number) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return '거리 계산 중';
  }
  return `약 ${distanceKm.toFixed(1)}km`;
}

export function formatDuration(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '시간 계산 중';
  }
  return `약 ${Math.round(totalMinutes)}분`;
}

export function formatThemeLabel(theme: string) {
  if (!theme || theme.trim().length === 0) {
    return '맞춤 드라이브';
  }

  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(theme)) {
    return theme.trim();
  }

  const normalized = theme.trim().toLowerCase();
  if (THEME_LABELS.has(normalized)) {
    return THEME_LABELS.get(normalized) ?? theme.trim();
  }

  return theme.trim();
}

export function summarizeStops(stops: CourseStop[], limit = 2) {
  if (!stops || stops.length === 0) {
    return '경유지 정보 준비 중';
  }
  const names = stops
    .map((stop) => stop.name?.trim())
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) {
    return '경유지 정보 준비 중';
  }
  const unique = Array.from(new Set(names)).slice(0, limit);
  return unique.join(' → ');
}

export function limitTags(tags: string[] | undefined, limit = 3) {
  if (!tags || tags.length === 0) {
    return [];
  }
  return tags.filter(Boolean).slice(0, limit);
}

export function buildStopKey(stop: RecommendedStop) {
  return `${stop.name}-${stop.lat}-${stop.lng}`;
}
