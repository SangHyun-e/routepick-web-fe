'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPost } from '@/feature/post/api';
import type { PostFormDraft, PostFormErrors } from '@/feature/post/types';
import { isEmptyErrors, toPostCreatePayload, validatePostForm } from '@/feature/post/validation';

const EMPTY_DRAFT: PostFormDraft = {
  title: '',
  content: '',
  region: '',
  latitude: '',
  longitude: '',
  tagsText: '',
};

export function usePostWrite() {
  const router = useRouter();

  const [draft, setDraft] = useState<PostFormDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof PostFormDraft>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (submitting) return;

    const nextErrors = validatePostForm(draft);
    setErrors(nextErrors);
    if (!isEmptyErrors(nextErrors)) return;

    const payload = toPostCreatePayload(draft);

    setSubmitting(true);
    try {
      const res = await createPost(payload);
      if (!res.ok) {
        setErrors({ form: res.message });
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
