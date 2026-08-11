"use client";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import type {
  JobSeekerProfileTab,
  ProfileChecklistItem,
} from "@/utils/job-seeker-profile";
import {
  Check,
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
  strengthPercent: number;
  strengthMessage: string;
  checklist: ProfileChecklistItem[];
  onOpenPersonal: () => void;
  onOpenPreferences: () => void;
  onSelectTab: (tab: JobSeekerProfileTab) => void;
  completionPercent: number;
};

export function JobSeekerProfileSidebar({
  strengthPercent,
  strengthMessage,
  checklist,
  onOpenPersonal,
  onOpenPreferences,
  onSelectTab,
  completionPercent,
}: JobSeekerProfileSidebarProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:gap-2 sm:text-sm"
            onClick={onOpenPersonal}
          >
            <Pencil className="size-3.5 sm:size-4" aria-hidden="true" />
            Edit Profile
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border-subtle bg-surface text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
                  className="block rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-primary-light sm:text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  My Resume
                </Link>
                <Link
                  href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
                  role="menuitem"
                  className="block rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-primary-light sm:text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  My Applications
                </Link>
                <Link
                  href={ROUTES.JOB_SEEKER_SAVED_JOBS}
                  role="menuitem"
                  className="block rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-primary-light sm:text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Saved Jobs
                </Link>
                <Link
                  href={ROUTES.JOB_SEEKER_SETTINGS}
                  role="menuitem"
                  className="block rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-primary-light sm:text-sm"
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
        className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5"
        aria-labelledby="profile-completion-heading"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="profile-completion-heading"
              className="text-sm font-bold text-foreground sm:text-base"
            >
              Profile Completion
            </h2>
            <p className="mt-1 text-xs font-semibold text-primary sm:text-sm">
              {completionPercent}% complete
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted sm:text-xs">
              {strengthMessage}
            </p>
          </div>
          <ProfileStrengthCircle percentage={strengthPercent} size={60} />
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-primary-light"
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
        <ul className="mt-4 space-y-2">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-hero-bg/60 px-3 py-2 text-xs sm:py-2.5 sm:text-sm"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                    item.completed
                      ? "border-primary bg-primary text-surface"
                      : "border-border-subtle bg-surface text-muted",
                  )}
                  aria-hidden="true"
                >
                  {item.completed ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : null}
                </span>
                <span className="truncate font-medium text-foreground">
                  {item.label}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-[11px] font-semibold sm:text-xs",
                  item.completed ? "text-primary" : "text-muted",
                )}
              >
                {item.completed ? "Done" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-[11px] font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-xs"
          onClick={() => onSelectTab("overview")}
        >
          View full progress →
        </button>
      </section>

      <section
        className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5"
        aria-labelledby="quick-actions-heading"
      >
        <h2
          id="quick-actions-heading"
          className="text-sm font-bold text-foreground sm:text-base"
        >
          Quick actions
        </h2>
        <ul className="mt-3 space-y-2">
          <li>
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-border-subtle bg-hero-bg/70 px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-11 sm:gap-2.5 sm:text-sm"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-light text-primary sm:size-8">
                <Sparkles className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
              Resume Builder
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-border-subtle bg-hero-bg/70 px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-11 sm:gap-2.5 sm:text-sm"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-light text-primary sm:size-8">
                <Upload className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
              Upload Resume
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-border-subtle bg-hero-bg/70 px-3 text-left text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-11 sm:gap-2.5 sm:text-sm"
              onClick={() => {
                onSelectTab("preferences");
                onOpenPreferences();
              }}
            >
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-light text-primary sm:size-8">
                <FileText className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
              Career Preferences
            </button>
          </li>
        </ul>
      </section>
    </aside>
  );
}
