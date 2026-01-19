'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPost } from '@/feature/post/api';
import type { PostFormDraft, PostFormErrors } from '@/feature/post/types';
import { isEmptyErrors, toPostCreatePayload, validatePostForm } from '@/feature/post/validation';
import { toast } from 'sonner';

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
    if (!isEmptyErrors(nextErrors)) {
      toast.error('입력 내용을 확인해주세요.');
      return;
    }

    const payload = toPostCreatePayload(draft);

    setSubmitting(true);

    try {
      const res = await createPost(payload);

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
          router.push(`/login?from=/posts/write`);
          return;
        }
        toast.error(res.message ?? '게시글 작성에 실패했습니다.');
        setErrors({ form: res.message });
        return;
      }

      toast.success('게시글이 작성되었습니다.');
      const postId = res.data?.id;
      router.push(postId ? `/posts/${postId}` : '/posts');
      router.refresh();
    } catch {
      toast.error('요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setErrors({ form: '요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setSubmitting(false);
    }
  }

  return { draft, errors, submitting, update, submit };
}
