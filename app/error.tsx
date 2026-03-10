'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-5xl font-bold text-slate-900">문제가 발생했습니다</h1>
      <p className="mb-6 text-slate-500">서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
      >
        다시 시도
      </button>
    </div>
  );
}
