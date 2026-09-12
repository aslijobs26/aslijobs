import { MoreVertical } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { operationsMyWorkDetailPath } from "../../../constants/operations-routes";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import type {
  OperationsWorkListItem,
  WorkItemStatus,
} from "../../../types/operations-work";
import { cn } from "../../../utils/cn";

export type MyWorkRowAction =
  | "view"
  | "select"
  | "claim"
  | "assign"
  | "reassign"
  | "start"
  | "wait"
  | "resume"
  | "complete";

interface MyWorkRowActionsProps {
  item: OperationsWorkListItem;
  busy?: boolean;
  onAction: (action: MyWorkRowAction) => void;
  /** Show “Select” to enter bulk selection mode (assign/reassign only). */
  showSelectOption?: boolean;
}

function statusActions(
  status: WorkItemStatus,
): Array<{ action: MyWorkRowAction; label: string }> {
  switch (status) {
    case "queued":
      return [{ action: "claim", label: "Claim" }];
    case "assigned":
      return [{ action: "start", label: "Start" }];
    case "in_progress":
      return [
        { action: "wait", label: "Mark waiting" },
        { action: "complete", label: "Complete" },
      ];
    case "waiting":
      return [{ action: "resume", label: "Resume" }];
    default:
      return [];
  }
}

export function MyWorkRowActions({
  item,
  busy,
  onAction,
  showSelectOption = false,
}: MyWorkRowActionsProps) {
  const navigate = useNavigate();
  const { canKey } = useOperationsPermissions();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canClaim = canKey("my_work.claim");
  const canAssign = canKey("my_work.assign");
  const canReassign = canKey("my_work.reassign");
  const canUpdate = canKey("my_work.update");
  const canComplete = canKey("my_work.complete");

  const isTeamQueue =
    item.status === "queued" && item.assignedToUserId == null;
  const hasAssignee = Boolean(item.assignedToUserId);

  const actions: Array<{ action: MyWorkRowAction; label: string }> = [
    { action: "view", label: "View details" },
  ];

  if (showSelectOption && (canAssign || canReassign)) {
    actions.push({ action: "select", label: "Select" });
  }

  if (isTeamQueue && canClaim) {
    actions.push({ action: "claim", label: "Claim" });
  }
  if ((isTeamQueue || !hasAssignee) && canAssign) {
    actions.push({ action: "assign", label: "Assign" });
  }
  if (hasAssignee && canReassign && item.status !== "completed") {
    actions.push({ action: "reassign", label: "Reassign" });
  }

  for (const next of statusActions(item.status)) {
    if (next.action === "claim" && (!canClaim || !isTeamQueue)) continue;
    if (next.action === "complete" && !canComplete) continue;
    if (
      (next.action === "start" ||
        next.action === "wait" ||
        next.action === "resume") &&
      !canUpdate
    ) {
      continue;
    }
    if (actions.some((a) => a.action === next.action)) continue;
    actions.push(next);
  }

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = actions.length * 36 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight + 8;
    setMenuStyle({
      position: "fixed",
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      left: Math.max(8, Math.min(rect.right - 180, window.innerWidth - 188)),
      width: 180,
      zIndex: 80,
    });
  }, [open, actions.length]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${item.displayId}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          busy && "opacity-50",
        )}
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={menuStyle}
              className="rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
            >
              {actions.map((entry) => (
                <button
                  key={entry.action}
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:bg-hero-bg"
                  onClick={() => {
                    setOpen(false);
                    if (entry.action === "view") {
                      navigate(operationsMyWorkDetailPath(item.id));
                      return;
                    }
                    onAction(entry.action);
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
