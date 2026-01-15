export default function PostWriteSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>

            <div className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-64 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>

            <div className="space-y-2">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-6">
            <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
