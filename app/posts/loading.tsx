export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="bg-muted mb-2 h-9 w-40 animate-pulse rounded-lg" />
          <div className="bg-muted h-4 w-56 animate-pulse rounded-lg" />
        </div>

        {/* Action bar skeleton */}
        <div className="mb-8 flex justify-end">
          <div className="bg-primary/20 h-10 w-32 animate-pulse rounded-lg" />
        </div>

        {/* Post list skeleton */}
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <div className="divide-border divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 px-6 py-5">
                {/* Title skeleton */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
                  </div>
                  <div className="bg-muted h-6 w-16 shrink-0 animate-pulse rounded-full" />
                </div>

                {/* Meta skeleton */}
                <div className="flex gap-3">
                  <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-28 animate-pulse rounded" />
                </div>

                {/* Stats skeleton */}
                <div className="flex gap-4 pt-1">
                  <div className="bg-muted h-3 w-12 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-12 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
