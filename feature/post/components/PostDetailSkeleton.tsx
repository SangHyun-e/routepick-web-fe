export default function PostDetailSkeleton() {
  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 h-4 w-20 animate-pulse rounded bg-slate-200" />
          <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
          <div className="mt-4 flex gap-8">
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </article>
    </>
  );
}
