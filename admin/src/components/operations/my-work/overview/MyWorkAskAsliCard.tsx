/**
 * ASLI AI Assistant for My Work — no Operations AI backend yet.
 */
export function MyWorkAskAsliCard() {
  const actions = [
    "Summarize my work for today",
    "Suggest next best action",
    "Draft a response",
    "Translate a message",
  ];

  return (
    <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] p-3.5 shadow-sm dark:from-primary/10 dark:to-surface">
      <div className="flex items-start gap-2.5">
        <img
          src="/assets/ask-asli-robot.png"
          alt=""
          className="size-11 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground">
            ASLI AI Assistant
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            How can I help you today?
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {actions.map((label) => (
          <li key={label}>
            <button
              type="button"
              disabled
              title="Ask ASLI is not available in Operations yet"
              className="flex w-full cursor-not-allowed items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-muted opacity-80"
            >
              <span>{label}</span>
              <span aria-hidden>›</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-muted">Coming soon</p>
    </section>
  );
}
