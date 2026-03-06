'use client';

import { deletePost } from '@/feature/post/api';
import { bffFetch } from '@/lib/bffFetch';
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
  const [isUpdating, setIsUpdating] = useState(false);

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

  const requestStatusChange = async (action: 'hide' | 'activate') => {
    const endpoint = action === 'hide' ? 'hide' : 'activate';
    const res = await bffFetch(`/api/proxy/posts/${postId}/${endpoint}`, { method: 'PATCH' });

    if (!res.ok) {
      const message = await res
        .json()
        .then((body) => body?.message as string | undefined)
        .catch(() => undefined);
      return { ok: false, status: res.status, message };
    }

    return { ok: true, status: res.status };
  };

  const handleStatus = async (action: 'hide' | 'activate') => {
    setIsUpdating(true);
    const res = await requestStatusChange(action);
    setIsUpdating(false);

    if (!res.ok) {
      if (res.status === 401) {
        toast.error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        router.push(`/login?from=/posts/${postId}`);
        return;
      }
      if (res.status === 403) {
        toast.error('권한이 없습니다.');
        return;
      }
      if (res.status === 404) {
        toast.error('게시글이 존재하지 않습니다.');
        router.push('/posts');
        return;
      }
      toast.error(res.message ?? '요청에 실패했습니다.');
      return;
    }

    toast.success(action === 'hide' ? '게시글이 숨김 처리되었습니다.' : '게시글이 활성화되었습니다.');
    router.refresh();
  };

  const hide = () => handleStatus('hide');
  const activate = () => handleStatus('activate');

  return {
    goEdit,
    confirmDelete,
    doDelete,
    showDeleteDialog,
    setShowDeleteDialog,
    hide,
    activate,
    isUpdating,
  };
}
