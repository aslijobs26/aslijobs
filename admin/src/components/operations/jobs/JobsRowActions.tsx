import { Copy, Eye, MoreVertical, Pause, Play, Power, XCircle } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { operationsJobDetailPath } from "../../../constants/operations-routes";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
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

const JOB_ACTION_PERMISSION_KEYS: Record<OperationsJobStatusAction, string> = {
  approve: "jobs.detail.actions.approve",
  reject: "jobs.detail.actions.reject",
  pause: "jobs.detail.actions.pause",
  resume: "jobs.detail.actions.resume",
  close: "jobs.detail.actions.close",
  reactivate: "jobs.detail.actions.reactivate",
  publish: "jobs.detail.actions.publish",
  expire: "jobs.detail.actions.expire",
};

const MENU_GAP_PX = 6;
const MENU_ITEM_HEIGHT_PX = 36;
const MENU_SEPARATOR_HEIGHT_PX = 9;
const MENU_VERTICAL_PADDING_PX = 8;

function jobStatusMenuActions(
  status: OperationsJobStatus,
  isLiveChangeReview: boolean,
): JobStatusMenuAction[] {
  if (isLiveChangeReview) {
    return [
      {
        action: "approve",
        label: "Approve & Publish Changes",
        icon: Play,
      },
      {
        action: "reject",
        label: "Reject Changes",
        icon: XCircle,
        tone: "danger",
      },
    ];
  }

  switch (status) {
    case "pending_approval":
      return [
        { action: "approve", label: "Approve & Publish", icon: Play },
        { action: "reject", label: "Reject Job", icon: XCircle, tone: "danger" },
      ];
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
    case "rejected":
      return [];
    default:
      return [];
  }
}

function estimateMenuHeight(
  statusActionCount: number,
  includeStatusActions: boolean,
): number {
  const baseItems = 2;
  const statusItems =
    includeStatusActions && statusActionCount > 0 ? statusActionCount : 0;
  const separator =
    includeStatusActions && statusActionCount > 0 ? MENU_SEPARATOR_HEIGHT_PX : 0;

  return (
    MENU_VERTICAL_PADDING_PX +
    (baseItems + statusItems) * MENU_ITEM_HEIGHT_PX +
    separator
  );
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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { canKey } = useOperationsPermissions();
  const statusActions = jobStatusMenuActions(
    job.status,
    Boolean(job.isLiveChangeReview),
  ).filter((item) => canKey(JOB_ACTION_PERMISSION_KEYS[item.action]));
  const isUpdating = pendingStatusJobId === job.jobId;
  const includeStatusActions = statusActions.length > 0 && Boolean(onStatusAction);
  const menuHeightEstimate = estimateMenuHeight(
    statusActions.length,
    includeStatusActions,
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp =
        spaceBelow < menuHeightEstimate + MENU_GAP_PX && spaceAbove > spaceBelow;

      setMenuStyle({
        position: "fixed",
        top: shouldOpenUp
          ? undefined
          : rect.bottom + MENU_GAP_PX,
        bottom: shouldOpenUp
          ? window.innerHeight - rect.top + MENU_GAP_PX
          : undefined,
        right: window.innerWidth - rect.right,
        zIndex: 1000,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, menuHeightEstimate]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
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

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={menuStyle}
      className="min-w-[10.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
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
      {includeStatusActions ? (
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
  ) : null;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${job.jobId}`}
        aria-expanded={open}
        aria-haspopup="menu"
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
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
