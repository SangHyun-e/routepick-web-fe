import { fetchComments } from '@/feature/comment/api';
import { CommentResponse } from '@/feature/comment/types';
import { PaginatedResponse } from '@/feature/post/types';
import { useCallback, useEffect, useState } from 'react';

const DEFAULT_SIZE = 20;

export function useComments(postId: number) {
  const [data, setData] = useState<PaginatedResponse<CommentResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      const res = await fetchComments(postId, nextPage, DEFAULT_SIZE);

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
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await load(page);
    })();

    return () => {
      mounted = false;
    };
  }, [page, load]);

  const refresh = useCallback(async () => {
    // 작성 후 첫 페이지로 돌아가서 다시 로드(UX 깔끔)
    setPage(0);
    await load(0);
  }, [load]);

  return {
    data,
    loading,
    page,
    setPage,
    refresh,
  };
}
