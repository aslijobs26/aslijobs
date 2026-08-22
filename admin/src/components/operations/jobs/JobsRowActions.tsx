import { Copy, Eye, MoreVertical, Pause, Play, Power, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { operationsJobDetailPath } from "../../../constants/operations-routes";
import type {
  OperationsJobListItem,
  OperationsJobStatus,
  OperationsJobStatusAction,
} from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";

interface JobStatusMenuAction {
  action: OperationsJobStatusAction;
  label: string;
  icon: typeof Pause;
  tone?: "danger";
}

function jobStatusMenuActions(status: OperationsJobStatus): JobStatusMenuAction[] {
  switch (status) {
    case "active":
      return [
        { action: "pause", label: "Pause Job", icon: Pause },
        { action: "close", label: "Close Job", icon: XCircle, tone: "danger" },
      ];
    case "paused":
      return [
        { action: "resume", label: "Activate Job", icon: Play },
        { action: "close", label: "Close Job", icon: XCircle, tone: "danger" },
      ];
    case "draft":
      return [{ action: "publish", label: "Publish Job", icon: Play }];
    case "closed":
    case "expired":
      return [{ action: "reactivate", label: "Reactivate Job", icon: Power }];
    default:
      return [];
  }
}

interface JobsRowActionsProps {
  job: OperationsJobListItem;
  pendingStatusJobId?: string | null;
  onStatusAction?: (
    job: OperationsJobListItem,
    action: OperationsJobStatusAction,
  ) => void;
}

export function JobsRowActions({
  job,
  pendingStatusJobId,
  onStatusAction,
}: JobsRowActionsProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusActions = jobStatusMenuActions(job.status);
  const isUpdating = pendingStatusJobId === job.jobId;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(job.jobId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
    setOpen(false);
  };

  const handleView = () => {
    setOpen(false);
    navigate(operationsJobDetailPath(job.jobId));
  };

  const handleStatusAction = (action: OperationsJobStatusAction) => {
    setOpen(false);
    onStatusAction?.(job, action);
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        aria-label={`Actions for ${job.jobId}`}
        aria-expanded={open}
        disabled={isUpdating}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors",
          "hover:bg-hero-bg hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          open && "bg-hero-bg text-foreground",
          isUpdating && "cursor-wait opacity-60",
        )}
      >
        <MoreVertical className="size-3.5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 min-w-[10.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleView}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-primary-light hover:text-primary"
          >
            <Eye className="size-3.5 shrink-0" aria-hidden="true" />
            View
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleCopy()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-primary-light hover:text-primary"
          >
            <Copy className="size-3.5 shrink-0" aria-hidden="true" />
            {copied ? "Copied" : "Copy Job ID"}
          </button>
          {statusActions.length > 0 && onStatusAction ? (
            <>
              <div
                className="my-1 border-t border-border-subtle"
                role="separator"
                aria-hidden="true"
              />
              {statusActions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.action}
                    type="button"
                    role="menuitem"
                    disabled={isUpdating}
                    onClick={() => handleStatusAction(item.action)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors disabled:cursor-wait disabled:opacity-60",
                      item.tone === "danger"
                        ? "text-danger hover:bg-danger/10"
                        : "text-foreground hover:bg-primary-light hover:text-primary",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    {isUpdating ? "Updating…" : item.label}
                  </button>
                );
              })}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
