import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';

export type UploadedImage = {
  key: string;
  url: string;
  size: number;
};

type UploadResponse = { images: UploadedImage[] };

export async function uploadPostImages(
  files: File[],
  postId?: number,
): Promise<ApiResult<UploadedImage[]>> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const query = postId ? `?postId=${postId}` : '';
  const res = await bffFetch(`/api/proxy/uploads/images${query}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      ok: false,
      status: res.status,
      message: err?.message ?? '이미지 업로드에 실패했습니다.',
    };
  }

  const data = (await res.json()) as UploadResponse;
  return { ok: true, data: data.images ?? [] };
}

export async function deletePostImage(key: string): Promise<ApiResult<void>> {
  const res = await bffFetch(
    `/api/proxy/uploads/images?key=${encodeURIComponent(key)}`,
    {
      method: 'DELETE',
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      ok: false,
      status: res.status,
      message: err?.message ?? '이미지 삭제에 실패했습니다.',
    };
  }

  return { ok: true, data: undefined };
}
