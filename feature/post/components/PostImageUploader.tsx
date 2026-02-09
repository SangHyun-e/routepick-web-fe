'use client';

import { useCallback, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { uploadPostImages, type UploadedImage } from '@/feature/upload/api';

type Props = {
  postId?: number;
  onInsert: (url: string) => void;
};

const MAX_FILES = 30;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function PostImageUploader({ postId, onInsert }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const fileArray = Array.from(files);
      const nextCount = images.length + fileArray.length;
      if (nextCount > MAX_FILES) {
        setError(`이미지는 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`);
        return;
      }
      const tooLarge = fileArray.find((file) => file.size > MAX_FILE_SIZE);
      if (tooLarge) {
        setError('파일 크기는 최대 15MB까지 업로드할 수 있습니다.');
        return;
      }

      setUploading(true);
      setError(null);
      const res = await uploadPostImages(fileArray, postId);
      setUploading(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setImages((prev) => [...prev, ...res.data]);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [images.length, postId],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">이미지 업로드</p>
          <p className="text-xs text-slate-500">최대 30장, 장당 15MB까지 업로드 가능</p>
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
            <div key={image.key} className="rounded-xl border border-slate-200 bg-white p-3">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
