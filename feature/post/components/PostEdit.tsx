'use client';

import type { PostResponse } from '@/feature/post/types';
import PostForm from '@/feature/post/components/PostForm';
import { usePostEdit } from '@/feature/post/hooks/usePostEdit';

type Props = {
  post: PostResponse;
};

export default function PostEdit({ post }: Props) {
  const { draft, errors, submitting, onChange, onSubmit } = usePostEdit({ post });

  return (
    <PostForm
      draft={draft}
      errors={errors}
      submitting={submitting}
      onChange={onChange}
      onSubmit={onSubmit}
      heading="게시글 수정"
      submitLabel="저장하기"
      cancelHref={`/posts/${post.id}`}
      backHref={`/posts/${post.id}`}
    />
  );
}
