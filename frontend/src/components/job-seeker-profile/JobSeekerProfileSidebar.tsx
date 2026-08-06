"use client";

import { JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS } from "@/constants/job-seeker-profile";
import { ROUTES } from "@/constants/routes";
import type { JobSeekerProfileTab } from "@/utils/job-seeker-profile";
import type { ProfileChecklistItem } from "@/utils/job-seeker-profile";
import type { JobSeekerPublic } from "@/types/job-seeker";
import { cn } from "@/utils/cn";
import {
  ChevronDown,
  FileText,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ProfileStrengthCircle } from "./ProfileStrengthCircle";

type JobSeekerProfileSidebarProps = {
  jobSeeker: JobSeekerPublic;
  strengthPercent: number;
  strengthMessage: string;
  checklist: ProfileChecklistItem[];
  onOpenPreferences: () => void;
  onOpenVisibility: () => void;
  onSelectTab: (tab: JobSeekerProfileTab) => void;
  onVisibilityChange: (value: JobSeekerPublic["profileVisibility"]) => void;
  isSavingVisibility: boolean;
  completionPercent: number;
};

export function JobSeekerProfileSidebar({
  jobSeeker,
  strengthPercent,
  strengthMessage,
  checklist,
  onOpenPreferences,
  onOpenVisibility,
  onSelectTab,
  onVisibilityChange,
  isSavingVisibility,
  completionPercent,
}: JobSeekerProfileSidebarProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibility = jobSeeker.profileVisibility ?? "visible";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={onOpenPreferences}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit Profile
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border-subtle bg-surface text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="More profile actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? menuId : undefined}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div
                id={menuId}
                role="menu"
                className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-border-subtle bg-surface p-1.5 shadow-lg"
              >
                <Link
                  href={ROUTES.JOB_SEEKER_MY_RESUME}
                  role="menuitem"
                  className="block rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-primary-light"
                  onClick={() => setMenuOpen(false)}
                >
                  My Resume
                </Link>
                <Link
                  href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
                  role="menuitem"
                  className="block rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-primary-light"
                  onClick={() => setMenuOpen(false)}
                >
                  My Applications
                </Link>
                <Link
                  href={ROUTES.JOB_SEEKER_SAVED_JOBS}
                  role="menuitem"
                  className="block rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-primary-light"
                  onClick={() => setMenuOpen(false)}
                >
                  Saved Jobs
                </Link>
                <Link
                  href={ROUTES.JOB_SEEKER_SETTINGS}
                  role="menuitem"
                  className="block rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-primary-light"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section
        className="rounded-xl border border-border-subtle bg-surface p-4"
        aria-labelledby="profile-completion-heading"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="profile-completion-heading"
              className="text-sm font-bold text-foreground"
            >
              Profile Completion
            </h2>
            <p className="mt-1 text-sm font-semibold text-primary">
              {completionPercent}% Completed
            </p>
          </div>
          <ProfileStrengthCircle percentage={strengthPercent} size={52} />
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-primary-light"
          role="progressbar"
          aria-label="Profile completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercent}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">{strengthMessage}</p>
        <ul className="mt-4 space-y-2.5">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    item.completed
                      ? "border-primary bg-primary text-surface"
                      : "border-border-subtle bg-hero-bg text-muted",
                  )}
                  aria-hidden="true"
                >
                  {item.completed ? "✓" : ""}
                </span>
                <span className="truncate text-foreground">{item.label}</span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs font-semibold",
                  item.completed ? "text-primary" : "text-amber-600",
                )}
              >
                {item.completed ? "Completed" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={() => onSelectTab("overview")}
        >
          View Full Progress →
        </button>
      </section>

      <section
        className="rounded-xl border border-border-subtle bg-surface p-4"
        aria-labelledby="quick-actions-heading"
      >
        <h2
          id="quick-actions-heading"
          className="text-sm font-bold text-foreground"
        >
          Quick actions
        </h2>
        <ul className="mt-3 space-y-2">
          <li>
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-border-subtle bg-hero-bg px-3 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Resume Builder
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-border-subtle bg-hero-bg px-3 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Upload className="size-4 text-primary" aria-hidden="true" />
              Upload Resume
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border-subtle bg-hero-bg px-3 text-left text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => {
                onSelectTab("preferences");
                onOpenPreferences();
              }}
            >
              <FileText className="size-4 text-primary" aria-hidden="true" />
              Career Preferences
            </button>
          </li>
        </ul>
      </section>

      <section
        className="rounded-xl border border-border-subtle bg-surface p-4"
        aria-labelledby="visibility-heading"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="visibility-heading" className="text-sm font-bold text-foreground">
            Profile visibility
          </h2>
          <button
            type="button"
            className="text-xs font-semibold text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={onOpenVisibility}
          >
            Manage
          </button>
        </div>
        <label htmlFor="sidebar-visibility" className="sr-only">
          Profile visibility
        </label>
        <div className="relative mt-3">
          <select
            id="sidebar-visibility"
            className="w-full appearance-none rounded-lg border border-border-subtle bg-hero-bg py-2.5 pl-3 pr-9 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            value={visibility}
            disabled={isSavingVisibility}
            onChange={(event) =>
              onVisibilityChange(
                event.target.value as JobSeekerPublic["profileVisibility"],
              )
            }
          >
            {JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {
            JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS.find(
              (option) => option.value === visibility,
            )?.description
          }
        </p>
      </section>
    </aside>
  );
}
