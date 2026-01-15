export default function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 h-5 w-20 animate-pulse rounded bg-slate-200" />
          <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="flex gap-4">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
