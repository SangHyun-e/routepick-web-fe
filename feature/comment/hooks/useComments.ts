import { fetchComments } from '@/feature/comment/api';
import { CommentResponse } from '@/feature/comment/types';
import { PaginatedResponse } from '@/feature/post/types';
import { useCallback, useEffect, useState } from 'react';

export function useComments(postId: number) {
  const [data, setData] = useState<PaginatedResponse<CommentResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      const res = await fetchComments(postId, targetPage, 20);

      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
      setLoading(false);
    },
    [postId],
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const refresh = useCallback(async () => {
    await load(page);
  }, [load, page]);

  return {
    data,
    loading,
    page,
    setPage,
    refresh,
  };
}
