export default function PostWriteSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header skeleton */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
        </div>

        {/* Card skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-6 p-6">
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-48 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>

            {/* Region skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>

            {/* Coordinates skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
                <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
              </div>
            </div>

            {/* Tags skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
