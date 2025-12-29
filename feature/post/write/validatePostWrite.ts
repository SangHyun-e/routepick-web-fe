import { PostCreateRequest } from '@/feature/post/types';

export type PostWriteDraft = {
  title: string;
  content: string;
  region: string;
  latitude: string;
  longitude: string;
  tagsText: string;
};

export type PostWriteErrors = Partial<Record<keyof PostWriteDraft, string>> & {
  form?: string;
};

function isNotOnlyWhitespace(value: string) {
  return value.trim().length > 0;
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') {
    return undefined;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export function parseTags(tagsText: string): string[] {
  const raw = tagsText
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return Array.from(new Set(raw)); // 중복 제거
}

export function toPostCreatePayload(draft: PostWriteDraft): PostCreateRequest {
  const latitude = parseOptionalNumber(draft.latitude);
  const longitude = parseOptionalNumber(draft.longitude);

  const tags = parseTags(draft.tagsText);

  return {
    title: draft.title.trim(),
    content: draft.content.trim(),
    region: isNotOnlyWhitespace(draft.region) ? draft.region.trim() : undefined,
    latitude,
    longitude,
    tags: tags.length > 0 ? tags : undefined,
  };
}

export function validatePostWrite(draft: PostWriteDraft): PostWriteErrors {
  const errors: PostWriteErrors = {};

  // title
  if (!isNotOnlyWhitespace(draft.title)) {
    errors.title = '제목은 필수입니다.';
  } else if (draft.title.trim().length > 120) {
    errors.title = '제목은 최대 120자까지 입력할 수 있습니다.';
  }

  // content
  if (!isNotOnlyWhitespace(draft.content)) {
    errors.content = '내용은 필수입니다.';
  } else if (draft.content.trim().length > 4000) {
    errors.content = '내용은 최대 4000자까지 입력할 수 있습니다.';
  }

  // region
  if (draft.region.trim().length > 0) {
    if (!isNotOnlyWhitespace(draft.region)) {
      errors.region = '지역은 공백만으로 입력할 수 없습니다.';
    } else if (draft.region.trim().length > 120) {
      errors.region = '지역은 최대 120자까지 입력할 수 있습니다.';
    }
  }

  // latitude / longitude pair rule
  const lat = parseOptionalNumber(draft.latitude);
  const lng = parseOptionalNumber(draft.longitude);

  const hasLatText = draft.latitude.trim().length > 0;
  const hasLngText = draft.longitude.trim().length > 0;

  // 숫자 파싱 실패
  if (hasLatText && lat === undefined) {
    errors.latitude = '위도는 숫자여야 합니다.';
  }
  if (hasLngText && lng === undefined) {
    errors.longitude = '경도는 숫자여야 합니다.';
  }

  // 둘 다 제공 (백엔드 @AssertTrue 대응)
  const hasLat = lat !== undefined;
  const hasLng = lng !== undefined;

  if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
    errors.form = '위도와 경도는 함께 제공되어야 합니다.';
  }

  // tags
  const tags = parseTags(draft.tagsText);

  if (tags.length > 50) {
    errors.tagsText = '태그는 최대 50개까지 입력할 수 있습니다.';
  } else {
    // 각 태그: 공백만 금지 + max 40 chars
    for (const t of tags) {
      if (t.length > 40) {
        errors.tagsText = '각 태그는 최대 40자까지 입력할 수 있습니다.';
        break;
      }
    }
  }
  return errors;
}

// errors가 비었는지 체크하는 유틸
export function isEmptyErrors(errors: PostWriteErrors) {
  return Object.values(errors).every((v) => v == null || v === '');
}
