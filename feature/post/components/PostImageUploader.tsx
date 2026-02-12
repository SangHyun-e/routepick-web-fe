'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { deletePostImage, uploadPostImages, type UploadedImage } from '@/feature/upload/api';

type Props = {
  postId?: number;
  onInsert: (url: string) => void;
};

const MAX_FILES = 30;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.85;
const RESIZE_EXCLUDED_TYPES = new Set(['image/gif', 'image/svg+xml']);

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const fixed = value >= 100 || index === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(fixed)}${units[index]}`;
};

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지 로드 실패'));
    };
    image.src = url;
  });

const replaceExtension = (name: string, extension: string) => {
  const trimmed = name.trim();
  if (!trimmed) return `upload${extension}`;
  const base = trimmed.replace(/\.[^/.]+$/, '');
  return `${base}${extension}`;
};

const resizeImageFile = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/') || RESIZE_EXCLUDED_TYPES.has(file.type)) {
    return file;
  }

  const image = await loadImage(file);
  const maxDimension = Math.max(image.width, image.height);
  if (maxDimension <= MAX_IMAGE_DIMENSION) {
    return file;
  }

  const scale = MAX_IMAGE_DIMENSION / maxDimension;
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return file;
  }

  ctx.drawImage(image, 0, 0, width, height);

  const outputType =
    file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
  const outputExtension =
    outputType === 'image/png' ? '.png' : outputType === 'image/webp' ? '.webp' : '.jpg';
  const quality = outputType === 'image/jpeg' || outputType === 'image/webp' ? IMAGE_QUALITY : undefined;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  if (!blob) {
    return file;
  }

  const filename = replaceExtension(file.name, outputExtension);
  return new File([blob], filename, { type: outputType });
};

export default function PostImageUploader({ postId, onInsert }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UploadedImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalSize = useMemo(
    () => images.reduce((sum, image) => sum + (image.size ?? 0), 0),
    [images],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const fileArray = Array.from(files);
      const nextCount = images.length + fileArray.length;
      if (nextCount > MAX_FILES) {
        setError(`이미지는 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`);
        return;
      }
      setUploading(true);
      setError(null);

      try {
        const resizedFiles: File[] = [];
        let nextTotal = totalSize;
        for (const file of fileArray) {
          const resized = await resizeImageFile(file);
          if (resized.size > MAX_FILE_SIZE) {
            setError('파일 크기는 최대 15MB까지 업로드할 수 있습니다.');
            return;
          }
          nextTotal += resized.size;
          if (nextTotal > MAX_TOTAL_SIZE) {
            setError(`전체 이미지는 최대 ${formatBytes(MAX_TOTAL_SIZE)}까지 업로드할 수 있습니다.`);
            return;
          }
          resizedFiles.push(resized);
        }

        const res = await uploadPostImages(resizedFiles, postId);
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setImages((prev) => [...prev, ...res.data]);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } catch {
        setError('이미지 처리 중 오류가 발생했습니다.');
      } finally {
        setUploading(false);
      }
    },
    [images.length, postId],
  );

  const handleRemove = useCallback((key: string) => {
    setImages((prev) => prev.filter((image) => image.key !== key));
  }, []);

  const confirmDelete = useCallback((image: UploadedImage) => {
    setDeleteTarget(image);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError(null);
    const res = await deletePostImage(deleteTarget.key);
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.ok) {
      setError(res.message ?? '이미지 삭제에 실패했습니다.');
      return;
    }
    handleRemove(deleteTarget.key);
  }, [deleteTarget, deleting, handleRemove]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">이미지 업로드</p>
          <p className="text-xs text-slate-500">
            최대 {MAX_FILES}장, 장당 {formatBytes(MAX_FILE_SIZE)} / 전체 {formatBytes(MAX_TOTAL_SIZE)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {images.length}장 · {formatBytes(totalSize)} / {formatBytes(MAX_TOTAL_SIZE)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <ImagePlus className="h-4 w-4" />
          {uploading ? '업로드 중...' : '이미지 추가'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" aria-live="polite">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.key} className="relative rounded-xl border border-slate-200 bg-white p-3">
              <button
                type="button"
                onClick={() => confirmDelete(image)}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-white"
                aria-label="업로드 이미지 제거"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="aspect-video overflow-hidden rounded-lg bg-slate-100">
                <img src={image.url} alt="업로드 이미지" className="h-full w-full object-cover" />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={() => onInsert(image.url)}
              >
                본문에 삽입
              </Button>
              <p className="mt-2 text-xs text-slate-500">{formatBytes(image.size)}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="업로드 이미지 삭제"
        description="이 이미지를 삭제할까요? 본문에 삽입한 이미지는 직접 제거해야 합니다."
        confirmText="삭제"
        cancelText="취소"
        confirmDisabled={deleting}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
