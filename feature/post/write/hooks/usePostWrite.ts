'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPost } from '@/feature/post/api';
import {
  isEmptyErrors,
  type PostWriteDraft,
  type PostWriteErrors,
  toPostCreatePayload,
  validatePostWrite,
} from '@/feature/post/write/validatePostWrite';

const EMPTY_DRAFT: PostWriteDraft = {
  title: '',
  content: '',
  region: '',
  latitude: '',
  longitude: '',
  tagsText: '',
};

export function usePostWrite() {
  const router = useRouter();

  const [draft, setDraft] = useState<PostWriteDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<PostWriteErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof PostWriteDraft>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (submitting) return;

    const nextErrors = validatePostWrite(draft);
    setErrors(nextErrors);
    if (!isEmptyErrors(nextErrors)) return;

    const payload = toPostCreatePayload(draft);

    setSubmitting(true);
    try {
      const res = await createPost(payload);

      if (!res.ok) {
        // 401: 로그인 필요
        if (res.status === 401) {
          setErrors({ form: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' });
          router.push('/login?from=/posts/write');
          return;
        }

        // 400: 서버 검증 실패(일단 form으로)
        if (res.status === 400) {
          setErrors({ form: res.message || '입력값을 확인해주세요.' });
          return;
        }

        // 그 외
        setErrors({
          form: res.message || '요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        });
        return;
      }

      const postId = res.data?.id;
      router.push(postId ? `/posts/${postId}` : '/posts');
      router.refresh();
    } catch {
      setErrors({ form: '요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setSubmitting(false);
    }
  }

  return { draft, errors, submitting, update, submit };
}
