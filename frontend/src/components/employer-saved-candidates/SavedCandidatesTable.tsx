"use client";

import {
  buildTelHref,
  buildWhatsAppHref,
  formatCandidateDate,
  getCandidateInitials,
} from "@/components/employer-candidates/candidates-ats-utils";
import { hasSavedCandidateInterviewScheduled } from "@/components/employer-saved-candidates/saved-candidates-utils";
import {
  getSavedCandidatePriorityLabel,
  getSavedCandidateTagLabel,
} from "@/constants/saved-candidates";
import { useCan } from "@/providers/employer-permission-provider";
import type {
  SavedCandidateListItem,
  SavedCandidatePriority,
} from "@/types/saved-candidates";
import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { cn } from "@/utils/cn";
import {
  Briefcase,
  Calendar,
  CalendarCheck,
  MapPin,
  MoreHorizontal,
  Phone,
  StickyNote,
  Tag,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

export type SavedCandidateRowActions = {
  onSelect: (applicationId: string) => void;
  onScheduleInterview: (applicationId: string) => void;
  onEditTags: (item: SavedCandidateListItem) => void;
  onEditNotes: (item: SavedCandidateListItem) => void;
  onUnsave: (item: SavedCandidateListItem) => void;
};

type SavedCandidatesTableProps = {
  items: SavedCandidateListItem[];
  selectedApplicationId: string | null;
  isLoading: boolean;
  actions: SavedCandidateRowActions;
};

function priorityBadgeClass(priority: SavedCandidatePriority): string {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 ring-red-200";
    case "low":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-amber-50 text-amber-800 ring-amber-200";
  }
}

const PRIORITY_SHORT_LABELS: Record<SavedCandidatePriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function PriorityBadge({
  priority,
}: {
  priority: SavedCandidatePriority | undefined;
}) {
  const value = priority ?? "medium";
  const fullLabel = getSavedCandidatePriorityLabel(value);
  return (
    <span
      title={fullLabel}
      aria-label={fullLabel}
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[10px] font-semibold leading-none ring-1 ring-inset",
        priorityBadgeClass(value),
      )}
    >
      {PRIORITY_SHORT_LABELS[value]}
    </span>
  );
}

function TagPills({ tags }: { tags: SavedCandidateListItem["tags"] }) {
  if (!tags.length) {
    return <span className="text-xs text-muted">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="inline-flex max-w-[8rem] truncate rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary"
        >
          {getSavedCandidateTagLabel(tag)}
        </span>
      ))}
      {tags.length > 3 ? (
        <span className="text-[10px] font-semibold text-muted">
          +{tags.length - 3}
        </span>
      ) : null}
    </div>
  );
}

function RowMoreMenu({
  item,
  actions,
  canUpdate,
  canWriteNotes,
}: {
  item: SavedCandidateListItem;
  actions: SavedCandidateRowActions;
  canUpdate: boolean;
  canWriteNotes: boolean;
}) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canEditNotes = canWriteNotes || canUpdate;

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 176;
    const gap = 4;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );

    setMenuStyle({
      position: "fixed",
      left,
      top: rect.bottom + gap,
      width: menuWidth,
      zIndex: 80,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- position from live DOM
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!canUpdate && !canWriteNotes) {
    return null;
  }

  const closeAndRun = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={`More actions for ${item.candidateName}`}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              style={menuStyle}
              className="rounded-xl border border-border-subtle bg-surface py-1 shadow-lg"
            >
              {canUpdate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-primary-light/40"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeAndRun(() => actions.onEditTags(item));
                  }}
                >
                  <Tag
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Edit save details
                </button>
              ) : null}
              {canEditNotes ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-primary-light/40"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeAndRun(() => actions.onEditNotes(item));
                  }}
                >
                  <StickyNote
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Edit notes
                </button>
              ) : null}
              {canUpdate ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeAndRun(() => actions.onUnsave(item));
                  }}
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                  Remove from saved
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function SavedCandidateTableRow({
  item,
  isSelected,
  actions,
}: {
  item: SavedCandidateListItem;
  isSelected: boolean;
  actions: SavedCandidateRowActions;
}) {
  const { can, canField, getFieldLevel } = useCan();
  const canViewPhone = canField("candidates", "phone");
  const phoneLevel = getFieldLevel("candidates", "phone");
  const canViewLocation = canField("candidates", "location");
  const canUpdate = can("candidates", "update");
  const canWriteNotes = canField("candidates", "notes", "write");
  const canScheduleInterview =
    can("interviews", "create") || can("interviews", "update");
  const interviewScheduled = hasSavedCandidateInterviewScheduled(
    item.applicationStatus,
  );

  const whatsappHref =
    canViewPhone && phoneLevel !== "mask"
      ? buildWhatsAppHref(item.candidatePhone)
      : null;
  const telHref =
    canViewPhone && phoneLevel !== "mask"
      ? buildTelHref(item.candidatePhone)
      : null;
  const selectRow = () => {
    actions.onSelect(item.applicationId);
  };

  return (
    <tr
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Open profile for ${item.candidateName}`}
      onClick={selectRow}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRow();
        }
      }}
      className={cn(
        "cursor-pointer border-b border-border-subtle transition-colors hover:bg-primary-light/15 focus-visible:bg-primary-light/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
        isSelected && "bg-primary-light/25",
      )}
    >
      <td className="w-[18rem] min-w-[15rem] max-w-[20rem] px-3 py-3 align-middle sm:w-[20rem] sm:min-w-[17rem] sm:px-4">
        <div className="flex w-full min-w-0 items-start gap-2.5 sm:gap-3">
          <span
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-surface sm:size-10 sm:text-xs"
            aria-hidden="true"
          >
            {getCandidateInitials(item.candidateName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold leading-5 tracking-tight text-foreground">
                {item.candidateName}
              </span>
              <PriorityBadge priority={item.priority} />
            </span>
            <span className="mt-1 flex min-w-0 flex-col gap-0.5 text-[11px] leading-4 text-muted sm:text-xs sm:leading-5">
              {item.candidateExperienceLabel ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Briefcase
                    className="size-3 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.candidateExperienceLabel}</span>
                </span>
              ) : null}
              {canViewLocation && item.candidateLocation ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin
                    className="size-3 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.candidateLocation}</span>
                </span>
              ) : null}
              {!item.candidateExperienceLabel &&
              !(canViewLocation && item.candidateLocation) ? (
                <span>—</span>
              ) : null}
            </span>
          </span>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 align-middle text-[11px] font-semibold text-foreground sm:text-xs xl:table-cell">
        {item.publicJobId}
      </td>
      <td className="min-w-[8rem] max-w-[12rem] px-3 py-3 align-middle text-[11px] text-foreground sm:text-xs">
        <span className="block truncate font-semibold">{item.jobTitle}</span>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 align-middle text-[11px] text-muted sm:text-xs lg:table-cell">
        {formatCandidateDate(item.savedAt)}
      </td>
      <td className="hidden min-w-[7rem] max-w-[10rem] px-3 py-3 align-middle md:table-cell">
        <TagPills tags={item.tags} />
      </td>
      <td className="whitespace-nowrap px-2 py-3 align-middle sm:px-3">
        <div className="flex items-center justify-end gap-0.5">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${item.candidateName}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={(event) => event.stopPropagation()}
            >
              <WhatsAppIcon className="text-base leading-none" />
            </a>
          ) : null}
          {telHref ? (
            <a
              href={telHref}
              aria-label={`Call ${item.candidateName}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={(event) => event.stopPropagation()}
            >
              <Phone className="size-4" aria-hidden="true" />
            </a>
          ) : null}
          {canScheduleInterview ? (
            <button
              type="button"
              aria-label={
                interviewScheduled
                  ? `View or update interview for ${item.candidateName}`
                  : `Schedule interview for ${item.candidateName}`
              }
              aria-pressed={interviewScheduled}
              title={
                interviewScheduled
                  ? "Interview scheduled"
                  : "Schedule interview"
              }
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                interviewScheduled
                  ? "bg-primary-light text-primary hover:bg-primary-light/80"
                  : "text-primary hover:bg-primary-light",
              )}
              onClick={(event) => {
                event.stopPropagation();
                actions.onScheduleInterview(item.applicationId);
              }}
            >
              {interviewScheduled ? (
                <CalendarCheck className="size-4" aria-hidden="true" strokeWidth={2.25} />
              ) : (
                <Calendar className="size-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
          <RowMoreMenu
            item={item}
            actions={actions}
            canUpdate={canUpdate}
            canWriteNotes={canWriteNotes}
          />
        </div>
      </td>
    </tr>
  );
}

export function SavedCandidatesTable({
  items,
  selectedApplicationId,
  isLoading,
  actions,
}: SavedCandidatesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-6">
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`saved-table-skel-${index}`}
              className="h-14 animate-pulse rounded-lg bg-primary-light/30"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <div className="overflow-x-auto scrollbar-hidden">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-hero-bg/60 text-[11px] font-semibold uppercase tracking-wide text-muted sm:text-xs">
              <th className="w-[18rem] min-w-[15rem] px-3 py-3 sm:w-[20rem] sm:min-w-[17rem] sm:px-4">
                Candidate
              </th>
              <th className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                Job ID
              </th>
              <th className="min-w-[8rem] px-3 py-3">Job title</th>
              <th className="hidden whitespace-nowrap px-3 py-3 lg:table-cell">
                Saved on
              </th>
              <th className="hidden min-w-[7rem] px-3 py-3 md:table-cell">Tags</th>
              <th className="whitespace-nowrap px-2 py-3 text-right sm:px-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <SavedCandidateTableRow
                key={item.id}
                item={item}
                isSelected={selectedApplicationId === item.applicationId}
                actions={actions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
