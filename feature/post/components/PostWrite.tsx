'use client';

import PostForm from '@/feature/post/components/PostForm';
import { usePostWrite } from '@/feature/post/hooks/usePostWrite';

export default function PostWrite() {
  const { draft, errors, submitting, update, submit } = usePostWrite();

  return (
    <PostForm
      draft={draft}
      errors={errors}
      submitting={submitting}
      onChange={update}
      onSubmit={submit}
    />
  );
}
