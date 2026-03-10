import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-6xl font-bold text-slate-900">404</h1>
      <p className="mb-6 text-slate-500">페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
      >
        홈으로 이동
      </Link>
    </div>
  );
}
