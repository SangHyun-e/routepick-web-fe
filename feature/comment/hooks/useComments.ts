import { fetchComments } from '@/feature/comment/api';
import { CommentResponse } from '@/feature/comment/types';
import { PaginatedResponse } from '@/feature/post/types';
import { useCallback, useEffect, useState } from 'react';

type UseCommentsOptions = {
  postId: number;
  size?: number; // 기본 20
};

export function useComments({ postId, size = 20 }: UseCommentsOptions) {
  const [data, setData] = useState<PaginatedResponse<CommentResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  const load = useCallback(async () => {
    setLoading(true);

    const res = await fetchComments(postId, page, size);

    if (res.ok && res.data) {
      setData(res.data);
    } else {
      setData(null);
    }

    setLoading(false);
  }, [postId, page, size]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await load();
    })();

    return () => {
      mounted = false;
    };
  }, [load]);

  // 외부에서 강제 새로고침(작성/삭제/수정 이후)
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  // 총 페이지(없으면 1로 취급)
  const totalPages: number = data?.totalPages ?? 1;

  useEffect(() => {
    if (!data) return;
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [data, page, totalPages]);

  return {
    data,
    loading,
    page,
    setPage,
    totalPages,
    refresh,
  };
}
