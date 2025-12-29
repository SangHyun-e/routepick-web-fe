'use client';

import type { PostWriteDraft, PostWriteErrors } from '@/feature/post/write/validatePostWrite';

type Props = {
  draft: PostWriteDraft;
  errors: PostWriteErrors;
  submitting: boolean;
  onChange: <K extends keyof PostWriteDraft>(key: K, value: string) => void;
  onSubmit: () => void;
};

export default function PostWriteForm({ draft, errors, submitting, onChange, onSubmit }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">새 글 쓰기</h1>

      <div className="space-y-5">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="제목"
          value={draft.title}
          onChange={(e) => onChange('title', e.target.value)}
          disabled={submitting}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={8}
          placeholder="내용"
          value={draft.content}
          onChange={(e) => onChange('content', e.target.value)}
          disabled={submitting}
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>

      <div>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="지역 (선택)"
          value={draft.region}
          onChange={(e) => onChange('region', e.target.value)}
          disabled={submitting}
        />
        {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="위도"
            value={draft.latitude}
            onChange={(e) => onChange('latitude', e.target.value)}
            disabled={submitting}
          />
          {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
        </div>
        <div>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="경도"
            value={draft.longitude}
            onChange={(e) => onChange('longitude', e.target.value)}
            disabled={submitting}
          />
          {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
        </div>
      </div>

      <div>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="태그 (쉼표로 구분)"
          value={draft.tagsText}
          onChange={(e) => onChange('tagsText', e.target.value)}
          disabled={submitting}
        />
        <p className="text-xs text-slate-500">
          태그는 쉼표로 구분하며, 중복 태그는 자동으로 제거됩니다.
        </p>
        {errors.tagsText && <p className="mt-1 text-sm text-red-600">{errors.tagsText}</p>}
      </div>

      {errors.form && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? '등록 중..' : '등록'}
        </button>
      </div>
    </div>
  );
}
