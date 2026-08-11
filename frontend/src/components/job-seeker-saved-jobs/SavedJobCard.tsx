"use client";

import { ROUTES } from "@/constants/routes";
import type { SavedJobListItem } from "@/types/saved-jobs";
import { formatJobSearchJobType } from "@/utils/job-search-format";
import { protectedApply } from "@/utils/job-apply-auth";
import { cn } from "@/utils/cn";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { showAppToast } from "@/utils/share-job";
import {
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Flag,
  MapPin,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatSavedOnDate, perkToneClasses } from "./saved-jobs-utils";

function SavedJobCompanyLogo({
  logoUrl,
  className,
}: {
  logoUrl: string;
  className?: string;
}) {
  const resolvedUrl = resolveMediaUrl(logoUrl);
  const [failedUrl, setFailedUrl] = useState("");
  const showImage = Boolean(resolvedUrl) && failedUrl !== resolvedUrl;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- employer upload URL
        <img
          key={resolvedUrl}
          src={resolvedUrl}
          alt=""
          className="size-full object-contain p-1.5"
          onError={() => setFailedUrl(resolvedUrl)}
        />
      ) : (
        <Building2 className="size-5 text-primary" aria-hidden="true" />
      )}
    </div>
  );
}

type SavedJobCardProps = {
  job: SavedJobListItem;
  onRemove: (publicJobId: string) => Promise<void>;
  isRemoving?: boolean;
};

function splitSalaryLabel(salaryLabel: string): {
  amount: string;
  period: string;
} {
  const trimmed = salaryLabel.trim();
  const match = trimmed.match(/^(.*?)(\/(?:month|year|day|hour))?$/i);
  if (!match) {
    return { amount: trimmed, period: "" };
  }
  return {
    amount: (match[1] ?? trimmed).trim(),
    period: match[2] ?? "",
  };
}

export function SavedJobCard({
  job,
  onRemove,
  isRemoving = false,
}: SavedJobCardProps) {
  const menuId = useId();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedLocally, setAppliedLocally] = useState(false);

  const isApplied = appliedLocally || job.isApplied;
  const href = ROUTES.jobPublic(job.publicJobId);
  const savedLabel = formatSavedOnDate(job.savedAt);
  const jobTypeLabel = job.jobType
    ? formatJobSearchJobType(job.jobType)
    : "";
  const { amount: salaryAmount, period: salaryPeriod } = splitSalaryLabel(
    job.salaryLabel,
  );

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const inMobile = mobileMenuRef.current?.contains(target);
      const inDesktop = desktopMenuRef.current?.contains(target);
      if (!inMobile && !inDesktop) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleShare = async () => {
    setMenuOpen(false);
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${href}`
        : href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.jobTitle,
          text: `${job.jobTitle} at ${job.companyName}`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      showAppToast("Job link copied");
    } catch {
      showAppToast("Unable to share right now");
    }
  };

  const handleApply = async () => {
    if (isApplied || job.isExpired || isApplying) {
      return;
    }
    setIsApplying(true);
    try {
      const result = await protectedApply({
        jobId: job.publicJobId,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        applyWhatsAppNumber: null,
      });
      if (result.status === "success") {
        setAppliedLocally(true);
      } else if (
        result.status === "error" &&
        /already applied/i.test(result.message)
      ) {
        setAppliedLocally(true);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const ctaLabel = isApplying
    ? "Applying…"
    : isApplied
      ? "Applied"
      : job.isExpired
        ? "Expired"
        : "Apply Now";

  const mobileMenuId = `${menuId}-mobile`;
  const desktopMenuId = `${menuId}-desktop`;

  return (
    <article
      className={cn(
        "border border-border-subtle bg-surface transition-colors hover:border-primary/25",
        "rounded-[18px] p-4 shadow-[0_4px_14px_rgba(26,43,60,0.06)]",
        "md:rounded-xl md:p-5 md:shadow-[0_1px_3px_rgba(26,43,60,0.04)]",
        job.isExpired && "opacity-90",
      )}
    >
      {/* —— Mobile card (< md / 768px) —— */}
      <div className="md:hidden">
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-x-3">
          <SavedJobCompanyLogo
            logoUrl={job.companyLogoUrl}
            className="size-14 rounded-2xl bg-resource-guide-surface ring-1 ring-resource-guide-icon/15"
          />

          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <h2 className="min-w-0 text-[13px] font-bold leading-4 text-foreground">
                <Link
                  href={href}
                  className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {job.jobTitle}
                </Link>
              </h2>
              {isApplied ? (
                <span className="inline-flex rounded-full bg-resource-interview-surface px-1.5 py-0.5 text-[10px] font-bold text-resource-interview-icon">
                  Applied
                </span>
              ) : null}
              {job.isExpired ? (
                <span className="inline-flex rounded-full bg-primary-light px-1.5 py-0.5 text-[10px] font-bold text-pin-state">
                  Expired
                </span>
              ) : null}
            </div>

            <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] font-medium text-foreground/80">
              <span className="truncate">{job.companyName || "Company"}</span>
              {job.isVerified ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-resource-guide-icon">
                  <CheckCircle2
                    className="size-3 shrink-0 fill-resource-guide-icon text-surface"
                    aria-hidden="true"
                  />
                  Verified
                </span>
              ) : null}
            </p>

            <div className="mt-1.5 space-y-1">
              {job.location ? (
                <p className="flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{job.location}</span>
                </p>
              ) : null}
              {job.experienceLabel || jobTypeLabel ? (
                <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] leading-4 text-muted">
                  <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
                  {job.experienceLabel ? (
                    <span className="truncate">{job.experienceLabel}</span>
                  ) : null}
                  {job.experienceLabel && jobTypeLabel ? (
                    <span
                      className="h-3 w-px shrink-0 bg-border"
                      aria-hidden="true"
                    />
                  ) : null}
                  {jobTypeLabel ? (
                    <span className="truncate">{jobTypeLabel}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>

          <div
            ref={mobileMenuRef}
            className="relative flex shrink-0 flex-col items-end gap-1.5"
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => void onRemove(job.publicJobId)}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary-light text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
                aria-label="Remove from saved jobs"
              >
                <Bookmark className="size-3.5 fill-current" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={mobileMenuId}
                onClick={() => setMenuOpen((current) => !current)}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="More actions"
              >
                <MoreVertical className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            {menuOpen ? (
              <CardActionsMenu
                menuId={mobileMenuId}
                href={href}
                isApplied={isApplied}
                isExpired={job.isExpired}
                isApplying={isApplying}
                onView={() => setMenuOpen(false)}
                onApply={() => {
                  setMenuOpen(false);
                  void handleApply();
                }}
                onRemove={() => {
                  setMenuOpen(false);
                  void onRemove(job.publicJobId);
                }}
                onShare={() => void handleShare()}
                onReport={() => {
                  setMenuOpen(false);
                  showAppToast("Thanks — we’ll review this job.");
                }}
                onHide={() => {
                  setMenuOpen(false);
                  showAppToast("We’ll show fewer similar jobs.");
                }}
              />
            ) : null}
            {savedLabel ? (
              <p className="text-right text-[10px] leading-3.5 text-muted">
                <span className="block whitespace-nowrap">Saved on</span>
                <span className="mt-0.5 block whitespace-nowrap font-semibold text-foreground">
                  {savedLabel}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div
          className="mt-2.5 border-t border-border-subtle"
          aria-hidden="true"
        />

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {job.perkLabels.slice(0, 4).map((label, index) => (
              <span
                key={`${job.id}-mobile-perk-${label}`}
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  perkToneClasses(index),
                )}
              >
                {label}
              </span>
            ))}
          </div>
          {savedLabel ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-resource-resume-surface px-2 py-0.5 text-[10px] font-semibold text-resource-resume-icon">
              <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
              Saved on {savedLabel}
            </span>
          ) : null}
        </div>

        <div
          className="mt-2.5 border-t border-border-subtle"
          aria-hidden="true"
        />

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-1">
            <span className="text-[15px] font-bold leading-none text-foreground">
              {salaryAmount}
            </span>
            {salaryPeriod ? (
              <span className="text-[11px] font-medium text-muted">
                {salaryPeriod}
              </span>
            ) : null}
          </p>

          <button
            type="button"
            disabled={isApplied || job.isExpired || isApplying}
            onClick={() => void handleApply()}
            className={cn(
              "inline-flex h-10 shrink-0 items-center justify-center rounded-[12px] px-4 text-[13px] font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "disabled:cursor-not-allowed",
              isApplied
                ? "border border-border bg-workflow-neutral-surface text-muted"
                : job.isExpired
                  ? "border border-border-subtle bg-workflow-neutral-surface text-muted"
                  : "bg-primary text-surface hover:bg-primary-hover",
            )}
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* —— Desktop / tablet card (md+) — unchanged —— */}
      <div className="hidden md:block">
        <div className="flex items-start gap-3 sm:gap-4">
          <SavedJobCompanyLogo
            logoUrl={job.companyLogoUrl}
            className="size-12 rounded-lg bg-workflow-neutral-surface ring-1 ring-border-subtle sm:size-14"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    <Link
                      href={href}
                      className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {job.jobTitle}
                    </Link>
                  </h2>
                  {job.isExpired ? (
                    <span className="inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-pin-state">
                      Expired
                    </span>
                  ) : null}
                  {isApplied ? (
                    <span className="inline-flex rounded-full bg-resource-interview-surface px-2 py-0.5 text-[10px] font-bold text-resource-interview-icon">
                      Applied
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
                  <span className="truncate">{job.companyName}</span>
                  {job.isVerified ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-resource-guide-icon">
                      <CheckCircle2
                        className="size-3.5 shrink-0 fill-resource-guide-icon text-surface"
                        aria-hidden="true"
                      />
                      Verified
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                <p className="text-sm font-bold text-foreground">
                  {job.salaryLabel}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
              {job.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {job.location}
                </span>
              ) : null}
              {job.experienceLabel ? (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
                  {job.experienceLabel}
                </span>
              ) : null}
              {job.shiftLabel ? (
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                  {job.shiftLabel}
                </span>
              ) : null}
              {job.jobType ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  {formatJobSearchJobType(job.jobType)}
                </span>
              ) : null}
            </div>

            {job.perkLabels.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {job.perkLabels.slice(0, 3).map((label, index) => (
                  <span
                    key={`${job.id}-perk-${label}`}
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      perkToneClasses(index),
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:hidden">
              {savedLabel ? (
                <span className="inline-flex rounded-md bg-resource-salary-surface px-2.5 py-1 text-[11px] font-semibold text-resource-salary-icon">
                  Saved on {savedLabel}
                </span>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">
                  {job.salaryLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-2" ref={desktopMenuRef}>
            <button
              type="button"
              disabled={isRemoving}
              onClick={() => void onRemove(job.publicJobId)}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary-light text-primary shadow-sm",
                "hover:border-primary/35 hover:bg-primary-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
              aria-label="Remove from saved jobs"
            >
              <Bookmark className="size-4 fill-current" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={desktopMenuId}
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border-subtle bg-surface text-muted hover:bg-primary-light/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="More actions"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </button>

            {menuOpen ? (
              <CardActionsMenu
                menuId={desktopMenuId}
                href={href}
                isApplied={isApplied}
                isExpired={job.isExpired}
                isApplying={isApplying}
                onView={() => setMenuOpen(false)}
                onApply={() => {
                  setMenuOpen(false);
                  void handleApply();
                }}
                onRemove={() => {
                  setMenuOpen(false);
                  void onRemove(job.publicJobId);
                }}
                onShare={() => void handleShare()}
                onReport={() => {
                  setMenuOpen(false);
                  showAppToast("Thanks — we’ll review this job.");
                }}
                onHide={() => {
                  setMenuOpen(false);
                  showAppToast("We’ll show fewer similar jobs.");
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          {savedLabel ? (
            <span className="hidden rounded-md bg-resource-salary-surface px-2.5 py-1 text-[11px] font-semibold text-resource-salary-icon sm:inline-flex">
              Saved on {savedLabel}
            </span>
          ) : (
            <span className="hidden sm:inline-flex" />
          )}

          <button
            type="button"
            disabled={isApplied || job.isExpired || isApplying}
            onClick={() => void handleApply()}
            className={cn(
              "ml-auto inline-flex h-9 min-w-[6.5rem] items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "disabled:cursor-not-allowed disabled:opacity-60",
              isApplied
                ? "border border-primary/20 bg-primary-light text-primary"
                : job.isExpired
                  ? "border border-border-subtle bg-workflow-neutral-surface text-muted"
                  : "bg-primary text-surface hover:bg-primary-hover",
            )}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

type CardActionsMenuProps = {
  menuId: string;
  href: string;
  isApplied: boolean;
  isExpired: boolean;
  isApplying: boolean;
  onView: () => void;
  onApply: () => void;
  onRemove: () => void;
  onShare: () => void;
  onReport: () => void;
  onHide: () => void;
};

function CardActionsMenu({
  menuId,
  href,
  isApplied,
  isExpired,
  isApplying,
  onView,
  onApply,
  onRemove,
  onShare,
  onReport,
  onHide,
}: CardActionsMenuProps) {
  return (
    <ul
      id={menuId}
      role="menu"
      className="absolute top-[calc(100%+0.35rem)] right-0 z-30 w-48 overflow-hidden rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_8px_24px_rgba(26,43,60,0.12)]"
    >
      <li role="none">
        <Link
          role="menuitem"
          href={href}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary-light/50"
          onClick={onView}
        >
          <Eye className="size-4 text-muted" aria-hidden="true" />
          View Job
        </Link>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          disabled={isApplied || isExpired || isApplying}
          onClick={onApply}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-primary-light/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 className="size-4 text-muted" aria-hidden="true" />
          {isApplied ? "Already Applied" : "Apply Now"}
        </button>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          onClick={onRemove}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-primary-light/50"
        >
          <Trash2 className="size-4 text-muted" aria-hidden="true" />
          Remove Saved Job
        </button>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          onClick={onShare}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-primary-light/50"
        >
          <Share2 className="size-4 text-muted" aria-hidden="true" />
          Share
        </button>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          onClick={onReport}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-primary-light/50"
        >
          <Flag className="size-4 text-muted" aria-hidden="true" />
          Report Job
        </button>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          onClick={onHide}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-primary-light/50"
        >
          <Eye className="size-4 text-muted" aria-hidden="true" />
          Hide Similar Jobs
        </button>
      </li>
    </ul>
  );
}
