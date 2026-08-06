"use client";

import {
  buildTelHref,
  buildWhatsAppHref,
  formatCandidateDate,
  getCandidateInitials,
} from "@/components/employer-candidates/candidates-ats-utils";
import { hasSavedCandidateInterviewScheduled } from "@/components/employer-saved-candidates/saved-candidates-utils";
import type { SavedCandidateRowActions } from "@/components/employer-saved-candidates/SavedCandidatesTable";
import {
  getSavedCandidatePriorityLabel,
  getSavedCandidateTagLabel,
} from "@/constants/saved-candidates";
import { useCan } from "@/providers/employer-permission-provider";
import type {
  SavedCandidateListItem,
  SavedCandidatePriority,
} from "@/types/saved-candidates";
import { cn } from "@/utils/cn";
import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import {
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarDays,
  MapPin,
  MoreHorizontal,
  Phone,
  StickyNote,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

function priorityBadgeClass(priority: SavedCandidatePriority): string {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 ring-red-200/80";
    case "low":
      return "bg-hero-bg text-muted ring-border-subtle";
    default:
      return "bg-amber-50 text-amber-800 ring-amber-200/80";
  }
}

function priorityAccentClass(priority: SavedCandidatePriority): string {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "low":
      return "bg-border";
    default:
      return "bg-amber-500";
  }
}

type SavedCandidatesCardGridProps = {
  items: SavedCandidateListItem[];
  selectedApplicationId: string | null;
  isLoading: boolean;
  actions: SavedCandidateRowActions;
  variant?: "compact" | "grid";
};

const iconActionClassName =
  "inline-flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function SavedCandidatesCardGrid({
  items,
  selectedApplicationId,
  isLoading,
  actions,
  variant = "compact",
}: SavedCandidatesCardGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-3",
          variant === "grid" && "sm:grid-cols-2",
        )}
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`saved-card-skel-${index}`}
            className="h-44 animate-pulse rounded-xl border border-border-subtle bg-surface"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-3", variant === "grid" && "sm:grid-cols-2")}
    >
      {items.map((item) => (
        <SavedCandidateCard
          key={item.id}
          item={item}
          isSelected={selectedApplicationId === item.applicationId}
          actions={actions}
        />
      ))}
    </div>
  );
}

function CardMoreMenu({
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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!canUpdate && !canWriteNotes) {
    return null;
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`More actions for ${item.candidateName}`}
        className={iconActionClassName}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 bottom-full z-20 mb-1 min-w-[10.5rem] rounded-xl border border-border-subtle bg-surface py-1 shadow-lg"
        >
          {canUpdate ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-primary-light/40"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                actions.onEditTags(item);
              }}
            >
              <Tag className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Edit details
            </button>
          ) : null}
          {canWriteNotes || canUpdate ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-primary-light/40"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                actions.onEditNotes(item);
              }}
            >
              <StickyNote
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              Notes
            </button>
          ) : null}
          {canUpdate ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                actions.onUnsave(item);
              }}
            >
              <Trash2 className="size-4 shrink-0" aria-hidden="true" />
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SavedCandidateCard({
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

  const priority = item.priority ?? "medium";
  const visibleTags = item.tags.slice(0, 3);
  const extraTagCount = Math.max(0, item.tags.length - visibleTags.length);
  const notesPreview = item.notes.trim();

  const whatsappHref =
    canViewPhone && phoneLevel !== "mask"
      ? buildWhatsAppHref(item.candidatePhone)
      : null;
  const telHref =
    canViewPhone && phoneLevel !== "mask"
      ? buildTelHref(item.candidatePhone)
      : null;
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-surface shadow-sm transition-[border-color,box-shadow,background-color]",
        isSelected
          ? "border-primary/40 shadow-md ring-1 ring-primary/15"
          : "border-border-subtle hover:border-primary/25 hover:shadow-md",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          priorityAccentClass(priority),
        )}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => actions.onSelect(item.applicationId)}
        className="w-full min-w-0 px-4 py-4 pl-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      >
        <div className="flex items-start gap-3">
          <span
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-surface"
            aria-hidden="true"
          >
            {getCandidateInitials(item.candidateName)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold tracking-tight text-foreground sm:text-[0.95rem]">
                  {item.candidateName}
                </h3>
                <p className="mt-0.5 truncate text-xs text-foreground">
                  <span className="font-semibold">{item.jobTitle}</span>
                  <span className="text-muted"> · {item.publicJobId}</span>
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                  priorityBadgeClass(priority),
                )}
              >
                {getSavedCandidatePriorityLabel(priority)}
              </span>
            </div>

            <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted">
              {item.candidateExperienceLabel ? (
                <li className="inline-flex min-w-0 max-w-full items-center gap-1">
                  <Briefcase className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.candidateExperienceLabel}</span>
                </li>
              ) : null}
              {canViewLocation && item.candidateLocation ? (
                <li className="inline-flex min-w-0 max-w-full items-center gap-1">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.candidateLocation}</span>
                </li>
              ) : null}
              <li className="inline-flex min-w-0 max-w-full items-center gap-1">
                <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  Saved {formatCandidateDate(item.savedAt)}
                </span>
              </li>
            </ul>

            {visibleTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex max-w-[9rem] truncate rounded-md bg-primary-light/80 px-2 py-0.5 text-[10px] font-semibold text-primary"
                  >
                    {getSavedCandidateTagLabel(tag)}
                  </span>
                ))}
                {extraTagCount > 0 ? (
                  <span className="inline-flex items-center rounded-md bg-hero-bg px-2 py-0.5 text-[10px] font-semibold text-muted">
                    +{extraTagCount}
                  </span>
                ) : null}
              </div>
            ) : null}

            {notesPreview ? (
              <p className="mt-3 line-clamp-2 rounded-lg bg-hero-bg/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                {notesPreview}
              </p>
            ) : null}
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-border-subtle bg-hero-bg/40 px-3 py-2 pl-5">
        <div className="flex items-center gap-0.5">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${item.candidateName}`}
              className={iconActionClassName}
              onClick={(event) => event.stopPropagation()}
            >
              <WhatsAppIcon className="text-base leading-none" />
            </a>
          ) : null}
          {telHref ? (
            <a
              href={telHref}
              aria-label={`Call ${item.candidateName}`}
              className={iconActionClassName}
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
                "inline-flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
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
        </div>

        <CardMoreMenu
          item={item}
          actions={actions}
          canUpdate={canUpdate}
          canWriteNotes={canWriteNotes}
        />
      </div>
    </article>
  );
}
