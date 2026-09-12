import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  Copy,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type {
  OperationsWorkDetail,
  WorkItemPriority,
} from "../../../../types/operations-work";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import { relatedEntityHref } from "../my-work-format";
import {
  MyWorkDueDateTimeField,
  duePartsFromIso,
  duePartsToIso,
  emptyDueParts,
  type MyWorkDueParts,
} from "../MyWorkDueDateTimeField";
import {
  formatWorkDetailDate,
  formatWorkDueControl,
  metaFieldIcon,
  primaryStatusAction,
  workSubtitleParts,
} from "./my-work-detail-format";
import { cn } from "../../../../utils/cn";

interface MyWorkDetailHeaderProps {
  item: OperationsWorkDetail;
  actionError: string | null;
  busy?: boolean;
  onAssign: () => void;
  onClaim: () => void;
  onStatus: (input: {
    status: "in_progress" | "waiting" | "completed";
    waitingReason?: string;
  }) => void;
  onPriority: (priority: WorkItemPriority) => void;
  onDue: (dueAt: string | null) => void;
}

const PRIORITY_OPTIONS: Array<{
  value: WorkItemPriority;
  label: string;
  caption: string;
  toneLabel: string;
  dotClassName: string;
  badgeClassName: string;
}> = [
  {
    value: "P1",
    label: "P1",
    toneLabel: "Urgent",
    caption: "Needs attention now",
    dotClassName: "bg-danger",
    badgeClassName: "bg-danger/10 text-danger",
  },
  {
    value: "P2",
    label: "P2",
    toneLabel: "Important",
    caption: "Handle soon",
    dotClassName: "bg-warning",
    badgeClassName: "bg-warning/12 text-warning",
  },
  {
    value: "P3",
    label: "P3",
    toneLabel: "Normal",
    caption: "Standard queue",
    dotClassName: "bg-muted",
    badgeClassName: "bg-border-subtle text-muted",
  },
];

const ghostControlClassName =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-semibold text-foreground shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/25 hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55";

const primaryControlClassName =
  "inline-flex h-8 items-center rounded-md bg-primary px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-55";

function MetaCell({
  label,
  value,
  field,
}: {
  label: string;
  value: ReactNode;
  field: Parameters<typeof metaFieldIcon>[0];
}) {
  const { Icon, iconClassName, iconBgClassName } = metaFieldIcon(field);
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
      <span
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md",
          iconBgClassName,
        )}
        aria-hidden
      >
        <Icon className={cn("size-3.5", iconClassName)} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
        <div className="mt-0.5 truncate text-[12px] font-semibold leading-tight text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}

function PriorityControl({
  value,
  disabled,
  onChange,
}: {
  value: WorkItemPriority;
  disabled?: boolean;
  onChange: (priority: WorkItemPriority) => void;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected =
    PRIORITY_OPTIONS.find((option) => option.value === value) ??
    PRIORITY_OPTIONS[2];

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
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label="Priority"
        onClick={() => setOpen((current) => !current)}
        className={ghostControlClassName}
      >
        <span className="text-muted">Priority</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold",
            selected.badgeClassName,
          )}
        >
          <span
            className={cn("size-1.5 rounded-full", selected.dotClassName)}
            aria-hidden
          />
          {selected.label}
        </span>
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
          aria-label="Select priority"
          className="absolute left-0 top-[calc(100%+0.4rem)] z-[90] w-[min(17.5rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-subtle bg-surface py-1.5 shadow-xl"
        >
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            Set priority
          </p>
          {PRIORITY_OPTIONS.map((option) => {
            const isSelected = option.value === value;
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
                    "mt-1 size-2 shrink-0 rounded-full",
                    option.dotClassName,
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold",
                        option.badgeClassName,
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="text-[12px] font-semibold text-foreground">
                      {option.toneLabel}
                    </span>
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

function DueControl({
  dueAt,
  disabled,
  onSave,
}: {
  dueAt: string | null;
  disabled?: boolean;
  onSave: (dueAt: string | null) => void;
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<MyWorkDueParts>(() =>
    duePartsFromIso(dueAt),
  );

  useEffect(() => {
    if (open) {
      setParts(duePartsFromIso(dueAt) ?? emptyDueParts());
    }
  }, [open, dueAt]);

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
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={ghostControlClassName}
      >
        <Calendar className="size-3.5 text-muted" aria-hidden />
        <span className="text-muted">Due</span>
        <span className="tabular-nums text-foreground">
          {formatWorkDueControl(dueAt)}
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Update due date"
          className="absolute left-0 top-[calc(100%+0.4rem)] z-[90] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border-subtle bg-surface p-3 shadow-xl"
        >
          <MyWorkDueDateTimeField value={parts} onChange={setParts} />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className={ghostControlClassName}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryControlClassName}
              onClick={() => {
                onSave(duePartsToIso(parts));
                setOpen(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function statusToneClassName(status: OperationsWorkDetail["status"]): string {
  switch (status) {
    case "completed":
      return "bg-success/12 text-success ring-success/15";
    case "waiting":
      return "bg-warning/12 text-warning ring-warning/15";
    case "in_progress":
      return "bg-sky-500/12 text-sky-700 ring-sky-500/15";
    case "cancelled":
      return "bg-danger/10 text-danger ring-danger/15";
    default:
      return "bg-primary-light text-primary ring-primary/15";
  }
}

function priorityToneClassName(priority: WorkItemPriority): string {
  switch (priority) {
    case "P1":
      return "bg-danger/10 text-danger ring-danger/15";
    case "P2":
      return "bg-warning/12 text-warning ring-warning/15";
    default:
      return "bg-border-subtle text-muted ring-border-subtle";
  }
}

export function MyWorkDetailHeader({
  item,
  actionError,
  busy = false,
  onAssign,
  onClaim,
  onStatus,
  onPriority,
  onDue,
}: MyWorkDetailHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const subtitle = workSubtitleParts(item);
  const relatedHref = relatedEntityHref(
    item.relatedEntityType,
    item.relatedEntityId,
  );
  const primary = primaryStatusAction(item);
  const canClaim = item.status === "queued" && item.assignedToUserId == null;
  const relatedLinkLabel =
    item.relatedEntityType === "job"
      ? "View Job"
      : item.relatedEntityType === "employer" ||
          item.relatedEntityType === "verification"
        ? "View Employer"
        : "View related";

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [moreOpen]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(item.displayId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <header className="border-b border-border-subtle px-3 pb-3.5 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={OPERATIONS_ROUTES.MY_WORK}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-1 text-[12px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to My Work
        </Link>
        <div className="inline-flex items-center gap-1">
          <span className="sr-only">
            Previous/Next navigation is not available on this page.
          </span>
        </div>
      </div>

      {/* Title band */}
      <div className="mt-3.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyId()}
              className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-hero-bg px-2 py-1 font-mono text-[11px] font-semibold tracking-wide text-muted transition-colors hover:bg-border-subtle/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={copied ? "Copied" : `Copy work item ID ${item.displayId}`}
            >
              <span className="truncate">{item.displayId}</span>
              {copied ? (
                <Check className="size-3 text-success" aria-hidden />
              ) : (
                <Copy className="size-3" aria-hidden />
              )}
            </button>
            {copied ? (
              <span className="text-[10px] font-medium text-success">Copied</span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-start gap-x-3 gap-y-2">
            <h1 className="min-w-0 text-[1.35rem] font-bold leading-tight tracking-tight text-foreground sm:text-[1.5rem]">
              {item.title}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-inset",
                  priorityToneClassName(item.priority),
                )}
              >
                {item.priority}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                  statusToneClassName(item.status),
                )}
              >
                {item.status === "completed" ? (
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                ) : null}
                {item.statusLabel}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
            <span className="font-medium text-foreground/85">
              {subtitle.company}
            </span>
            {subtitle.role ? (
              <>
                <span className="text-border" aria-hidden>
                  ·
                </span>
                <span>{subtitle.role}</span>
              </>
            ) : null}
            {relatedHref ? (
              <>
                <span className="text-border" aria-hidden>
                  ·
                </span>
                <Link
                  to={relatedHref}
                  className="inline-flex items-center gap-0.5 font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {relatedLinkLabel}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Meta strip */}
      <div className="mt-4 overflow-hidden rounded-lg border border-border-subtle bg-hero-bg/50">
        <div className="grid grid-cols-1 divide-y divide-border-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-6">
          <MetaCell label="Type" field="type" value={item.typeLabel} />
          <MetaCell
            label="Related"
            field="related"
            value={item.relatedLabel || "—"}
          />
          <MetaCell
            label="Assignee"
            field="assignee"
            value={item.assignedToName ?? "Unassigned"}
          />
          <MetaCell
            label="Created by"
            field="createdBy"
            value={item.createdByName ?? "System"}
          />
          <MetaCell
            label="Due Date"
            field="due"
            value={formatWorkDetailDate(item.dueAt)}
          />
          <MetaCell
            label="Waiting Reason"
            field="waiting"
            value={item.waitingReason || "—"}
          />
        </div>
      </div>

      {actionError ? (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger"
        >
          {actionError}
        </div>
      ) : null}

      {/* Action toolbar */}
      <div className="mt-3.5 flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <OperationsCanKey permissionKey="my_work.assign">
            {item.assignedToUserId == null ? (
              <button
                type="button"
                disabled={busy}
                onClick={onAssign}
                className={ghostControlClassName}
              >
                Assign
              </button>
            ) : null}
          </OperationsCanKey>
          <OperationsCanKey permissionKey="my_work.reassign">
            {item.assignedToUserId ? (
              <button
                type="button"
                disabled={busy}
                onClick={onAssign}
                className={ghostControlClassName}
              >
                Reassign
              </button>
            ) : null}
          </OperationsCanKey>

          <OperationsCanKey permissionKey="my_work.priority.update">
            <PriorityControl
              value={item.priority}
              disabled={busy}
              onChange={onPriority}
            />
          </OperationsCanKey>

          <OperationsCanKey permissionKey="my_work.due.update">
            <DueControl dueAt={item.dueAt} disabled={busy} onSave={onDue} />
          </OperationsCanKey>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          {canClaim ? (
            <OperationsCanKey permissionKey="my_work.claim">
              <button
                type="button"
                disabled={busy}
                onClick={onClaim}
                className={primaryControlClassName}
              >
                Claim Work
              </button>
            </OperationsCanKey>
          ) : null}

          {primary ? (
            <OperationsCanKey
              permissionKey={
                primary.status === "completed"
                  ? "my_work.complete"
                  : "my_work.update"
              }
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus({ status: primary.status })}
                className={primaryControlClassName}
              >
                {primary.label}
              </button>
            </OperationsCanKey>
          ) : null}

          <div ref={moreRef} className="relative">
            <button
              type="button"
              disabled={busy || item.status === "completed"}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((current) => !current)}
              className={ghostControlClassName}
            >
              More Actions
              <ChevronDown className="size-3.5 text-muted" aria-hidden />
            </button>
            {moreOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.35rem)] z-[80] min-w-[12rem] overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-xl"
              >
                <OperationsCanKey permissionKey="my_work.update">
                  {item.status === "in_progress" ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-hero-bg"
                      onClick={() => {
                        setMoreOpen(false);
                        onStatus({ status: "waiting" });
                      }}
                    >
                      Mark as Waiting
                    </button>
                  ) : null}
                </OperationsCanKey>
                <OperationsCanKey permissionKey="my_work.complete">
                  {item.status === "in_progress" ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-hero-bg"
                      onClick={() => {
                        setMoreOpen(false);
                        onStatus({ status: "completed" });
                      }}
                    >
                      Mark as Completed
                    </button>
                  ) : null}
                </OperationsCanKey>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
