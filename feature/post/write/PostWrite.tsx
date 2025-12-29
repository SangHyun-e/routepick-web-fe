'use client';
import { usePostWrite } from '@/feature/post/write/hooks/usePostWrite';
import PostWriteForm from '@/feature/post/write/components/PostWriteForm';

export default function PostWrite() {
  const { draft, errors, submitting, update, submit } = usePostWrite();

  return (
    <PostWriteForm
      draft={draft}
      errors={errors}
      submitting={submitting}
      onChange={update}
      onSubmit={submit}
    />
  );
}
