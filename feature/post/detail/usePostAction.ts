'use client';

import { deletePost } from '@/feature/post/api';
import { useRouter } from 'next/navigation';

type Options = {
  postId: number;
  onDeleted?: () => void;
};

export function usePostActions({ postId, onDeleted }: Options) {
  const router = useRouter();

  const goEdit = () => {
    router.push(`/posts/${postId}/edit`);
  };

  const doDelete = async () => {
    const ok = window.confirm('정말 삭제할까요? 삭제한 글은 복구할 수 없습니다.');
    if (!ok) return;

    const res = await deletePost(postId);

    if (!res.ok) {
      if (res.status === 401) {
        window.alert('로그인이 필요합니다. 다시 로그인해주세요.');
        router.push(`/login?from=/posts/${postId}`);
        return;
      }
      if (res.status === 403) {
        window.alert('삭제 권한이 없습니다.');
        return;
      }
      if (res.status === 404) {
        window.alert('이미 삭제되었거나 존재하지 않는 게시글입니다.');
        router.push('/posts');
        return;
      }
      window.alert(res.message ?? '삭제에 실패했습니다.');
      return;
    }

    onDeleted?.();
    router.push('/posts');
    router.refresh();
  };

  return { goEdit, doDelete };
}
