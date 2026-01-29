'use client';

import { deleteComment, toggleCommentLike, updateComment } from '@/feature/comment/api';
import {
  CommentLikeToggleResponse,
  CommentResponse,
  CommentUpdateRequest,
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
  // 삭제/수정 중복 클릭 방지용 로딩 상태
  const [deleting, setDeleting] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [liking, setLiking] = useState<boolean>(false);

  /** 댓글 삭제
   * 백엔드 권한 검증(작성자/관리자)은 서버가 책임
   * - 프론트는 UX용 (버튼 disable, 토스트, refresh)만 처리
   */
  const doDelete = useCallback(
    async (commentId: number) => {
      if (deleting) return;

      setDeleting(true);

      try {
        const res = await deleteComment(postId, commentId);

        if (!res.ok) {
          if (res.status === 401) {
            toast.error('로그인이 필요합니다.');
            return;
          }
          toast.error(res.message ?? '댓글 삭제에 실패했습니다.');
          return;
        }

        toast.success('댓글이 삭제되었습니다.');
        await onRefresh();
      } catch {
        toast.error('댓글 삭제 중 오류가 발생했습니다.');
      } finally {
        setDeleting(false);
      }
    },
    [deleting, postId, onRefresh],
  );

  /**
   * 댓글 수정 실행
   * -payload.content만 받는 구조
   */

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

  /** 댓글 좋아요 토글
   *  - UI에서 optimistic update
   *  - 여기선 서버 결과만 반환
   */

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
          toast.error(res.message ?? '댓글 좋아요에 실패했습니다.');
          return null;
        }
        return res.data ?? null;
      } catch {
        toast.error('댓글 좋아요 처리 중 오류가 발생했습니다.');
        return null;
      } finally {
        setLiking(false);
      }
    },
    [liking, postId],
  );

  return {
    // states
    deleting,
    updating,
    liking,
    // actions
    doDelete,
    doUpdate,
    doToggleLike,
  };
}
