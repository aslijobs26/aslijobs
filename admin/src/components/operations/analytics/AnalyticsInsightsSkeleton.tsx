export function AnalyticsInsightsSkeleton() {
  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      aria-busy="true"
      aria-label="Loading analytics"
    >
      <div className="h-40 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-72 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        <div className="h-72 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        <div className="h-72 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        <div className="h-64 animate-pulse rounded-xl border border-border-subtle bg-surface" />
      </div>
    </div>
  );
}
