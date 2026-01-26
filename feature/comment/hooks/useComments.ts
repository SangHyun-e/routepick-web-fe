import { fetchComments } from '@/feature/comment/api';
import { CommentResponse } from '@/feature/comment/types';
import { useEffect, useState } from 'react';

export function useComments(postId: number) {
  const [data, setData] = useState<PaginatedResponse<CommentResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const res = await fetchComments(postId, page, 20);

      if (!mounted) return;

      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [postId, page]);

  return {
    data,
    loading,
    page,
    setPage,
  };
}
