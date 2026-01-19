'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import type {
  PostResponse,
  PostUpdateRequest,
  PostFormDraft,
  PostFormErrors,
} from '@/feature/post/types';
import { updatePost } from '@/feature/post/api';
import { isEmptyErrors, parseTags, validatePostForm } from '@/feature/post/validation';
import { toast } from 'sonner';

type Options = {
  post: PostResponse;
};

function toDraft(post: PostResponse): PostFormDraft {
  return {
    title: post.title ?? '',
    content: post.content ?? '',
    region: post.region ?? '',
    latitude: post.latitude != null ? String(post.latitude) : '',
    longitude: post.longitude != null ? String(post.longitude) : '',
    tagsText: Array.isArray(post.tags) ? post.tags.join(', ') : '',
  };
}

function parseNumberOrNull(v: string): number | undefined {
  const s = v.trim();
  if (s.length === 0) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function toUpdatePayload(draft: PostFormDraft): PostUpdateRequest {
  const regionTrimmed = draft.region.trim();

  const payload: PostUpdateRequest = {
    title: draft.title,
    content: draft.content,
    latitude: parseNumberOrNull(draft.latitude),
    longitude: parseNumberOrNull(draft.longitude),
    tags: parseTags(draft.tagsText),
  };

  if (regionTrimmed.length > 0) {
    payload.region = regionTrimmed;
  }
  return payload;
}

export function usePostEdit({ post }: Options) {
  const router = useRouter();

  const initialDraft = useMemo<PostFormDraft>(() => toDraft(post), [post]);

  const [draft, setDraft] = useState<PostFormDraft>(initialDraft);
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const onChange = useCallback(<K extends keyof PostFormDraft>(key: K, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (submitting) return;

    const nextErrors = validatePostForm(draft);
    setErrors(nextErrors);
    if (!isEmptyErrors(nextErrors)) {
      toast.error('입력 내용을 확인해주세요.');
      return;
    }

    const payload = toUpdatePayload(draft);

    setSubmitting(true);

    try {
      const res = await updatePost(post.id, payload);

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
          setErrors({ form: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' });
          router.push(`/login?from=/posts/${post.id}/edit`);
          return;
        }
        if (res.status === 403) {
          toast.error('수정 권한이 없습니다.');
          setErrors({ form: '수정 권한이 없습니다.' });
          router.push(`/posts/${post.id}`);
          return;
        }
        if (res.status === 404) {
          toast.error('게시글이 존재하지 않습니다.');
          setErrors({ form: '게시글이 존재하지 않습니다.' });
          router.push('/posts');
          return;
        }
        toast.error(res.message ?? '수정 중 오류가 발생했습니다.');
        setErrors({ form: res.message ?? '수정 중 오류가 발생했습니다.' });
        return;
      }

      toast.success('게시글이 수정되었습니다.');
      router.replace(`/posts/${post.id}`);
      router.refresh();
    } catch {
      toast.error('수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setErrors({ form: '수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setSubmitting(false);
    }
  }, [draft, post.id, router, submitting]);

  return { draft, errors, submitting, onChange, onSubmit };
}
