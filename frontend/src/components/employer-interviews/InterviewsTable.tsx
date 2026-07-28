"use client";

import {
  formatCandidateDate,
  getCandidateInitials,
} from "@/components/employer-candidates/candidates-ats-utils";
import type { EmployerInterviewListItem } from "@/types/employer-interviews";
import {
  formatInterviewTime12h,
  interviewDisplayStatus,
  resolveInterviewTypeDisplay,
  type InterviewTypeDisplay,
} from "@/types/employer-interviews";
import { cn } from "@/utils/cn";
import {
  Building2,
  ChevronDown,
  MoreVertical,
  Phone,
  Video,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type InterviewsTableProps = {
  interviews: EmployerInterviewListItem[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: "interview_asc" | "interview_desc";
  emptyTitle?: string;
  emptyDescription?: string;
  onScheduleInterview?: () => void;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onSortChange: (sort: "interview_asc" | "interview_desc") => void;
  onRowOpen: (applicationId: string) => void;
  onEditInterview: (applicationId: string) => void;
  onCompleteStatus: (applicationId: string) => void;
  onCancelInterview: (applicationId: string) => void;
};

const COLUMN_COUNT = 8;

function InterviewTypeIcon({
  variant,
}: {
  variant: InterviewTypeDisplay["variant"];
}) {
  if (variant === "whatsapp") {
    return (
      <Phone className="size-4 shrink-0 text-whatsapp" aria-hidden="true" />
    );
  }
  if (variant === "phone") {
    return <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />;
  }
  if (variant === "offline") {
    return (
      <Building2 className="size-4 shrink-0 text-muted" aria-hidden="true" />
    );
  }
  if (variant === "meet") {
    return (
      <Video className="size-4 shrink-0 text-sky-600" aria-hidden="true" />
    );
  }
  if (variant === "zoom") {
    return (
      <Video className="size-4 shrink-0 text-blue-600" aria-hidden="true" />
    );
  }
  if (variant === "teams") {
    return (
      <Video className="size-4 shrink-0 text-indigo-600" aria-hidden="true" />
    );
  }
  return <Video className="size-4 shrink-0 text-primary" aria-hidden="true" />;
}

function PersonAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary ring-1 ring-border-subtle",
        size === "md" ? "size-9 text-xs" : "size-8 text-[11px]",
      )}
      aria-hidden="true"
    >
      {getCandidateInitials(name)}
    </span>
  );
}

export function InterviewsTable({
  interviews,
  isLoading,
  isError,
  page,
  limit,
  total,
  totalPages,
  sort,
  emptyTitle = "No interviews scheduled",
  emptyDescription = "Schedule an interview from a candidate profile to see it here.",
  onScheduleInterview,
  onRetry,
  onPageChange,
  onSortChange,
  onRowOpen,
  onEditInterview,
  onCompleteStatus,
  onCancelInterview,
}: InterviewsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuLabelId = useId();

  useEffect(() => {
    if (!openMenuId) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [openMenuId]);

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const toggleDateSort = () => {
    onSortChange(sort === "interview_asc" ? "interview_desc" : "interview_asc");
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-[64rem] w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr className="border-b border-border-subtle">
              <th className="px-4 py-3.5 whitespace-nowrap">Candidate</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Job ID</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Job Title</th>
              <th className="px-4 py-3.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={toggleDateSort}
                  className="inline-flex items-center gap-1 uppercase tracking-wide text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={`Sort by interview date, currently ${sort === "interview_asc" ? "ascending" : "descending"}`}
                >
                  Interview Date &amp; Time
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      sort === "interview_desc" && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap">Interview Type</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Interviewer</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
              <th className="px-4 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-border-subtle">
                  <td colSpan={COLUMN_COUNT} className="px-4 py-3.5">
                    <div className="h-11 animate-pulse rounded-lg bg-primary-light/40" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Unable to load interviews
                  </p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : interviews.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {emptyTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted">{emptyDescription}</p>
                  {onScheduleInterview ? (
                    <button
                      type="button"
                      onClick={onScheduleInterview}
                      className="mt-3 inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      Schedule Interview
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : (
              interviews.map((item) => {
                const status = interviewDisplayStatus(item);
                const interviewType = resolveInterviewTypeDisplay({
                  mode: item.interviewMode,
                  meetingLink: item.meetingLink,
                });
                const interviewerLabel =
                  item.interviewerName.trim() || "Unassigned";

                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-border-subtle transition-colors hover:bg-primary-light/20"
                    onClick={() => onRowOpen(item.id)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-[12rem] items-center gap-3">
                        <PersonAvatar name={item.candidateName} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-foreground">
                            {item.candidateName}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {item.candidatePhone || "—"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-foreground">
                      {item.publicJobId || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block min-w-[10rem] font-semibold text-foreground">
                        {item.jobTitle || "—"}
                      </span>
                      <span className="block text-xs text-muted">
                        {item.jobLocation || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="block font-semibold text-foreground">
                        {formatCandidateDate(item.interviewDate)}
                      </span>
                      <span className="block text-xs text-muted">
                        {formatInterviewTime12h(item.interviewTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-foreground">
                        <InterviewTypeIcon variant={interviewType.variant} />
                        {interviewType.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-[10rem] items-center gap-2.5">
                        <PersonAvatar name={interviewerLabel} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-foreground">
                            {interviewerLabel}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {item.interviewerDesignation || "—"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td
                      className="relative px-4 py-3.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === item.id}
                        aria-controls={
                          openMenuId === item.id ? menuLabelId : undefined
                        }
                        aria-label={`Actions for ${item.candidateName}`}
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <MoreVertical className="size-4" aria-hidden="true" />
                      </button>
                      {openMenuId === item.id ? (
                        <div
                          ref={menuRef}
                          id={menuLabelId}
                          role="menu"
                          className="absolute right-4 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light/50"
                            onClick={() => {
                              setOpenMenuId(null);
                              onRowOpen(item.id);
                            }}
                          >
                            Open candidate
                          </button>
                          {!item.isCancelled ? (
                            <button
                              type="button"
                              role="menuitem"
                              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light/50"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEditInterview(item.id);
                              }}
                            >
                              Edit / Reschedule
                            </button>
                          ) : null}
                          {item.status === "interview_scheduled" &&
                          !item.isCancelled ? (
                            <button
                              type="button"
                              role="menuitem"
                              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-primary-light/50"
                              onClick={() => {
                                setOpenMenuId(null);
                                onCompleteStatus(item.id);
                              }}
                            >
                              Mark completed
                            </button>
                          ) : null}
                          {item.status === "interview_scheduled" &&
                          !item.isCancelled ? (
                            <button
                              type="button"
                              role="menuitem"
                              className="block w-full px-3 py-2 text-left text-sm text-pin-state hover:bg-red-50"
                              onClick={() => {
                                setOpenMenuId(null);
                                onCancelInterview(item.id);
                              }}
                            >
                              Cancel Interview
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-surface px-4 py-3">
        <p className="text-xs text-muted">
          Showing {from} to {to} of {total} interviews
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-foreground">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-light/40 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
