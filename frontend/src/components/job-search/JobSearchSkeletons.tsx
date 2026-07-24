"use client";

export function JobSearchListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-border-subtle bg-surface p-4"
        >
          <div className="flex gap-3">
            <div className="size-11 rounded-lg bg-muted/40" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted/40" />
              <div className="h-3 w-1/3 rounded bg-muted/30" />
              <div className="h-3 w-4/5 rounded bg-muted/30" />
              <div className="flex gap-2 pt-1">
                <div className="h-8 w-24 rounded-lg bg-muted/30" />
                <div className="h-8 w-32 rounded-lg bg-muted/30" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function JobSearchOverviewSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4 rounded-2xl border border-border-subtle bg-surface p-5"
      aria-busy="true"
      aria-label="Loading job details"
    >
      <div className="flex gap-3">
        <div className="size-14 rounded-xl bg-muted/40" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted/40" />
          <div className="h-4 w-1/2 rounded bg-muted/30" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 rounded-lg bg-muted/25" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-1/3 rounded bg-muted/40" />
        <div className="h-20 rounded-lg bg-muted/25" />
      </div>
    </div>
  );
}
