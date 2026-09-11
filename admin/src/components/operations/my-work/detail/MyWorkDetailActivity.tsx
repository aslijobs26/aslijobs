import { Check, ChevronDown, Filter, GitBranch, List } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { OperationsWorkHistoryEntry } from "../../../../types/operations-work";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import {
  formatHistoryEventLabel,
  formatWorkDetailDateTime,
} from "./my-work-detail-format";
import { cn } from "../../../../utils/cn";

interface MyWorkDetailActivityProps {
  history: OperationsWorkHistoryEntry[];
}

type EventFilter = "all" | "status";

const EVENT_FILTER_OPTIONS: Array<{
  value: EventFilter;
  label: string;
  caption: string;
  Icon: typeof List;
}> = [
  {
    value: "all",
    label: "All Events",
    caption: "Show every history entry",
    Icon: List,
  },
  {
    value: "status",
    label: "Status changes",
    caption: "Only status transitions",
    Icon: GitBranch,
  },
];

function HistoryEventFilter({
  value,
  onChange,
}: {
  value: EventFilter;
  onChange: (next: EventFilter) => void;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected =
    EVENT_FILTER_OPTIONS.find((option) => option.value === value) ??
    EVENT_FILTER_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label="Filter events"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/25 hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Filter className="size-3.5 text-muted" aria-hidden />
        <span className="text-muted">Filter</span>
        <span className="text-foreground">{selected.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Filter events"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-[90] w-[min(16.5rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-subtle bg-surface py-1.5 shadow-xl"
        >
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            Filter events
          </p>
          {EVENT_FILTER_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            const Icon = option.Icon;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-hero-bg focus-visible:bg-hero-bg focus-visible:outline-none",
                  isSelected && "bg-primary/[0.04]",
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-hero-bg text-muted",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                    {option.caption}
                  </span>
                </span>
                <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center">
                  {isSelected ? (
                    <Check
                      className="size-3.5 text-primary"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function MyWorkDetailActivity({ history }: MyWorkDetailActivityProps) {
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

  const filteredHistory = useMemo(() => {
    const sorted = [...history].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    );
    if (eventFilter === "status") {
      return sorted.filter(
        (entry) => entry.toStatus && entry.fromStatus !== entry.toStatus,
      );
    }
    return sorted;
  }, [history, eventFilter]);

  return (
    <OperationsCanKey
      permissionKey="my_work.detail.history"
      fallback={
        <section className="rounded-xl border border-border-subtle bg-surface p-4">
          <p className="text-xs text-muted">
            Work history is restricted for your role.
          </p>
        </section>
      }
    >
      <section className="flex min-h-0 min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">
          <h2 className="text-[13px] font-semibold text-foreground">
            Work History
          </h2>
          <HistoryEventFilter value={eventFilter} onChange={setEventFilter} />
        </div>

        <div className="min-h-[18rem] p-3 sm:p-4">
          {filteredHistory.length === 0 ? (
            <p className="text-xs text-muted">No history yet.</p>
          ) : (
            <ol className="relative flex flex-col pl-1">
              <span
                className="absolute bottom-1 left-[0.4375rem] top-1 w-px bg-success/40"
                aria-hidden
              />
              {filteredHistory.map((entry, index) => (
                <li
                  key={`${entry.at}-${entry.action}-${index}`}
                  className="relative flex gap-3 pb-4 last:pb-0"
                >
                  <span
                    className="relative z-[1] mt-1.5 size-2 shrink-0 rounded-full bg-success ring-2 ring-surface"
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-foreground">
                        {formatHistoryEventLabel(entry)}
                      </p>
                      {entry.note ? (
                        <p className="mt-0.5 text-[11px] text-muted">
                          {entry.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-[11px] font-medium text-muted">
                        {formatWorkDetailDateTime(entry.at)}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted/80">
                        {entry.actorName || "System"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </OperationsCanKey>
  );
}
