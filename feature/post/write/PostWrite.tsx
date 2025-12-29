'use client';

import { createPost } from '@/feature/post/api';
import {
  isEmptyErrors,
  PostWriteDraft,
  PostWriteErrors,
  toPostCreatePayload,
  validatePostWrite,
} from '@/feature/post/write/validatePostWrite';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const EMPTY_DRAFT: PostWriteDraft = {
  title: '',
  content: '',
  region: '',
  latitude: '',
  longitude: '',
  tagsText: '',
};

export default function PostWrite() {
  const router = useRouter();
  const [draft, setDraft] = useState<PostWriteDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<PostWriteErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof PostWriteDraft>(key: K, value: string) {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    if (submitting) return;

    const nextErrors = validatePostWrite(draft);
    setErrors(nextErrors);
    if (!isEmptyErrors(nextErrors)) {
      return;
    }

    const payload = toPostCreatePayload(draft);

    setSubmitting(true);
    try {
      const res = await createPost(payload);
      if (!res.ok) {
        // 백엔드 에러 메세지(또는 fallback) 노출
        setErrors({ form: res.message });
        return;
      }
      const postId = res.data?.id;
      router.push(postId ? `/posts/${postId}` : '/posts');
    } catch {
      setErrors({ form: '요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">새 글 쓰기</h1>

      <div className="space-y-5">
        {/* 제목 */}
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="제목"
          value={draft.title}
          onChange={(e) => update('title', e.target.value)}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>
      {/* 내용 */}
      <div>
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={8}
          placeholder="내용"
          value={draft.content}
          onChange={(e) => update('content', e.target.value)}
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>

      {/* 지역 */}
      <div>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="지역 (선택)"
          value={draft.region}
          onChange={(e) => update('region', e.target.value)}
        />
        {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
      </div>

      {/* 좌표 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="위도"
            value={draft.latitude}
            onChange={(e) => update('latitude', e.target.value)}
          />
          {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
        </div>
        <div>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="경도"
            value={draft.longitude}
            onChange={(e) => update('longitude', e.target.value)}
          />
          {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
        </div>
      </div>
      {/* 태그 */}
      <div>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="태그 (쉼표로 구분)"
          value={draft.tagsText}
          onChange={(e) => update('tagsText', e.target.value)}
        />
        <p className="text-xs text-slate-500">
          태그는 쉼표로 구분하며, 중복 태그는 자동으로 제거됩니다.
        </p>
        {errors.tagsText && <p className="mt-1 text-sm text-red-600">{errors.tagsText}</p>}
      </div>
      {/* 폼 에러 */}
      {errors.form && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      {/* 제출 */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? '등록 중..' : '등록'}
        </button>
      </div>
    </div>
  );
}
