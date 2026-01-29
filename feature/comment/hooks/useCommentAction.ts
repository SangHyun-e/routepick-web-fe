'use client';

import { deleteComment, updateComment, toggleCommentLike } from '@/feature/comment/api';
import {
  CommentResponse,
  CommentUpdateRequest,
  CommentLikeToggleResponse,
} from '@/feature/comment/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

type useCommentActionsOptions = {
  postId: number;
  onRefresh: () => Promise<void>;
};

type UpdateParams = {
  commentId: number;
  payload: CommentUpdateRequest;
};

export function useCommentActions({ postId, onRefresh }: useCommentActionsOptions) {
  const [deleting, setDeleting] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [liking, setLiking] = useState<boolean>(false);

  const doDelete = useCallback(
    async (commentId: number): Promise<boolean> => {
      if (deleting) return false;

      setDeleting(true);

      try {
        const res = await deleteComment(postId, commentId);

        if (!res.ok) {
          if (res.status === 401) {
            toast.error('로그인이 필요합니다.');
            return false;
          }
          toast.error(res.message ?? '댓글 삭제에 실패했습니다.');
          return false;
        }

        toast.success('댓글이 삭제되었습니다.');
        await onRefresh();
        return true;
      } catch {
        toast.error('댓글 삭제 중 오류가 발생했습니다.');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [deleting, postId, onRefresh],
  );

  const doUpdate = useCallback(
    async ({ commentId, payload }: UpdateParams): Promise<CommentResponse | null> => {
      if (updating) return null;

      const trimmed: string = payload.content.trim();
      if (trimmed.length === 0) {
        toast.error('댓글 내용을 입력해주세요.');
        return null;
      }
      if (trimmed.length > 1000) {
        toast.error('댓글은 최대 1000자까지 입력할 수 있습니다.');
        return null;
      }

      setUpdating(true);

      try {
        const res = await updateComment(postId, commentId, { content: trimmed });

        if (!res.ok) {
          if (res.status === 401) {
            toast.error('로그인이 필요합니다.');
            return null;
          }
          toast.error(res.message ?? '댓글 수정에 실패했습니다.');
          return null;
        }

        toast.success('댓글이 수정되었습니다.');
        await onRefresh();
        return res.data ?? null;
      } catch {
        toast.error('댓글 수정 중 오류가 발생했습니다.');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [onRefresh, postId, updating],
  );

  const doToggleLike = useCallback(
    async (commentId: number): Promise<CommentLikeToggleResponse | null> => {
      if (liking) return null;

      setLiking(true);

      try {
        const res = await toggleCommentLike(postId, commentId);

        if (!res.ok) {
          if (res.status === 401) {
            toast.error('로그인이 필요합니다.');
            return null;
          }
          toast.error(res.message ?? '좋아요 실패');
          return null;
        }

        return res.data ?? null;
      } catch {
        toast.error('좋아요 중 오류가 발생했습니다.');
        return null;
      } finally {
        setLiking(false);
      }
    },
    [liking, postId],
  );

  return {
    deleting,
    updating,
    liking,
    doDelete,
    doUpdate,
    doToggleLike,
  };
}
