export function MyWorkPageSkeleton() {
  return (
    <div className="flex w-full min-w-0 animate-pulse flex-col gap-3" aria-hidden>
      <div className="h-10 w-48 rounded-md bg-border-subtle/80" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-border-subtle/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_16.5rem] xl:items-start">
        <div className="h-80 rounded-xl bg-border-subtle/60" />
        <div className="flex flex-col gap-3">
          <div className="h-36 rounded-xl bg-border-subtle/60" />
          <div className="h-40 rounded-xl bg-border-subtle/60" />
          <div className="h-24 rounded-xl bg-border-subtle/60" />
        </div>
      </div>
    </div>
  );
}
