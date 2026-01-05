export default function PostWriteSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-slate-200" />

      {/* Title Skeleton */}
      <div className="mt-5 space-y-2">
        <div className="h-40 w-full animate-pulse rounded bg-slate-200" />
      </div>
      {/* Content Skeleton */}
      <div className="mt-5 space-y-2">
        <div className="h-40 w-full animate-pulse rounded bg-slate-200" />
      </div>
      {/* region Skeleton */}
      <div className="mt-5 space-y-2">
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
      {/* lag/tag Skeleton */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
      {/* tags Skeleton */}
      <div className="mt-5 space-y-2">
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      </div>
      {/* Submit Button Skeleton */}
      <div className="mt-6">
        <div className="h-10 w-24 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
