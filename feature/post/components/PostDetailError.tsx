'use client';

import { AlertCircle, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostDetailErrorProps {
  error?: string;
}

export default function PostDetailError({ error }: PostDetailErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">게시글을 불러올 수 없습니다</h2>
          <p className="mb-6 text-sm text-slate-600">
            {error ?? '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => router.push('/posts')}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
