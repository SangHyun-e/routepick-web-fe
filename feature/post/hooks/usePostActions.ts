'use client';

import { deletePost } from '@/feature/post/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

type Options = {
  postId: number;
  onDeleted?: () => void;
};

export function usePostActions({ postId, onDeleted }: Options) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const goEdit = () => {
    router.push(`/posts/${postId}/edit`);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(true);
  };

  const doDelete = async () => {
    setShowDeleteDialog(false);

    const res = await deletePost(postId);

    if (!res.ok) {
      if (res.status === 401) {
        toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
        router.push(`/login?from=/posts/${postId}`);
        return;
      }
      if (res.status === 403) {
        toast.error('삭제 권한이 없습니다.');
        return;
      }
      if (res.status === 404) {
        toast.error('이미 삭제되었거나 존재하지 않는 게시글입니다.');
        router.push('/posts');
        return;
      }
      toast.error(res.message ?? '삭제에 실패했습니다.');
      return;
    }

    toast.success('게시글이 삭제되었습니다.');
    onDeleted?.();
    router.push('/posts');
    router.refresh();
  };

  return { goEdit, confirmDelete, doDelete, showDeleteDialog, setShowDeleteDialog };
}
