"use client";

import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import { ROUTES } from "@/constants/routes";
import type { NotificationListItem } from "@/types/notifications";
import type { SeekerApplicationStats } from "@/types/job-seeker-applications";
import { cn } from "@/utils/cn";
import Image from "next/image";
import Link from "next/link";
import whatsappSupportImage from "@/assets/my-applications-whatsapp-support.png";
import {
  CalendarDays,
  Gift,
  Send,
  type LucideIcon,
} from "lucide-react";
import {
  getSuccessRatePercent,
  getStatsChipCount,
  getTotalAppliedCount,
} from "./applied-jobs-utils";

type AppliedJobsSidebarProps = {
  stats: SeekerApplicationStats | undefined;
  statsLoading: boolean;
  notifications: NotificationListItem[];
  notificationsLoading: boolean;
};

type ReminderTone = "green" | "blue" | "purple";

type ReminderCard = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  tone: ReminderTone;
  createdAt: string;
};

const REMINDER_TONE_CYCLE: ReminderTone[] = ["green", "blue", "purple"];

function reminderIcon(notification: NotificationListItem): LucideIcon {
  if (notification.category === "interview") {
    return CalendarDays;
  }
  if (notification.category === "offer") {
    return Gift;
  }
  return Send;
}

function reminderCta(notification: NotificationListItem): string {
  if (notification.category === "interview") {
    return "View Details";
  }
  if (notification.category === "offer") {
    return "View Offer";
  }
  return "View Application";
}

/**
 * Show only the latest 3 hiring notifications (newest first).
 * One card per application — the most recent update for that application.
 */
function pickReminders(
  notifications: NotificationListItem[],
): ReminderCard[] {
  const hiringNotifications = [...notifications]
    .filter(
      (item) =>
        item.category === "application" ||
        item.category === "interview" ||
        item.category === "offer",
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const latestByApplication = new Map<string, NotificationListItem>();
  for (const notification of hiringNotifications) {
    const key =
      notification.referenceId?.trim() ||
      notification.actionPath?.trim() ||
      notification.id;
    if (!latestByApplication.has(key)) {
      latestByApplication.set(key, notification);
    }
  }

  return [...latestByApplication.values()].slice(0, 3).map((notification, index) => ({
    id: notification.id,
    title: notification.title || "Application Update",
    body: notification.body,
    href: notification.actionPath || ROUTES.JOB_SEEKER_APPLIED_JOBS,
    cta: reminderCta(notification),
    icon: reminderIcon(notification),
    tone: REMINDER_TONE_CYCLE[index % REMINDER_TONE_CYCLE.length]!,
    createdAt: notification.createdAt,
  }));
}

const REMINDER_TONES: Record<
  ReminderTone,
  { icon: string; button: string }
> = {
  green: {
    icon: "bg-resource-guide-surface text-resource-guide-icon",
    button:
      "bg-resource-guide-surface text-resource-guide-icon hover:bg-resource-guide-icon-surface",
  },
  blue: {
    icon: "bg-primary-light text-primary",
    button: "bg-primary-light text-primary hover:bg-primary-light/80",
  },
  purple: {
    icon: "bg-resource-resume-surface text-resource-resume-icon",
    button:
      "bg-resource-resume-surface text-resource-resume-icon hover:bg-resource-resume-icon-surface",
  },
};

type OverviewMetricTone =
  | "primary"
  | "blue"
  | "orange"
  | "purple"
  | "teal"
  | "green"
  | "red";

const OVERVIEW_METRIC_TONES: Record<
  OverviewMetricTone,
  { surface: string; label: string; value: string }
> = {
  primary: {
    surface: "bg-primary-light",
    label: "text-primary",
    value: "text-primary",
  },
  blue: {
    surface: "bg-resource-salary-surface",
    label: "text-resource-salary-icon",
    value: "text-resource-salary-icon",
  },
  orange: {
    surface: "bg-resource-interview-surface",
    label: "text-resource-interview-icon",
    value: "text-resource-interview-icon",
  },
  purple: {
    surface: "bg-resource-resume-surface",
    label: "text-resource-resume-icon",
    value: "text-resource-resume-icon",
  },
  teal: {
    surface: "bg-primary-light/70",
    label: "text-primary",
    value: "text-primary",
  },
  green: {
    surface: "bg-resource-guide-surface",
    label: "text-resource-guide-icon",
    value: "text-resource-guide-icon",
  },
  red: {
    surface: "bg-primary-light",
    label: "text-pin-state",
    value: "text-pin-state",
  },
};

function OverviewMetric({
  label,
  value,
  loading,
  tone,
}: {
  label: string;
  value: number | null;
  loading: boolean;
  tone: OverviewMetricTone;
}) {
  const colors = OVERVIEW_METRIC_TONES[tone];

  return (
    <div className={cn("rounded-lg px-3 py-2.5", colors.surface)}>
      <p className={cn("text-[11px] font-medium", colors.label)}>{label}</p>
      {loading ? (
        <div className="mt-1 h-5 w-8 animate-pulse rounded bg-surface/60" />
      ) : (
        <p className={cn("mt-0.5 text-lg font-bold tabular-nums", colors.value)}>
          {value ?? 0}
        </p>
      )}
    </div>
  );
}

export function AppliedJobsSidebar({
  stats,
  statsLoading,
  notifications,
  notificationsLoading,
}: AppliedJobsSidebarProps) {
  const reminders = pickReminders(notifications);
  const total = getTotalAppliedCount(stats);
  const successRate = getSuccessRatePercent(stats);
  const whatsappExternal = WHATSAPP_JOIN_URL.startsWith("http");

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20" aria-label="Application insights">
      <section className="rounded-xl border border-border-subtle bg-resource-resume-surface/60 p-4 shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element -- static PNG icon asset */}
            <img
              src="/images/asli-ai-reminders-bot.png"
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 object-contain bg-transparent"
            />
            Asli AI Reminders
          </h2>
          <Link
            href={ROUTES.JOB_SEEKER_NOTIFICATIONS}
            className="text-xs font-semibold text-resource-salary-icon hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            View All
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {notificationsLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-xl bg-surface/70"
              />
            ))
          ) : reminders.length === 0 ? (
            <p className="rounded-xl bg-surface px-3 py-4 text-xs text-muted shadow-[0_1px_3px_rgba(26,43,60,0.04)]">
              No reminders right now. We&apos;ll surface interview and offer
              updates here.
            </p>
          ) : (
            reminders.map((card) => {
              const Icon = card.icon;
              const tone = REMINDER_TONES[card.tone];
              return (
                <article
                  key={card.id}
                  className="rounded-xl bg-surface p-3 shadow-[0_1px_4px_rgba(26,43,60,0.06)]"
                >
                  <div className="flex gap-2.5">
                    <span
                      className={cn(
                        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                        tone.icon,
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="size-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-foreground">
                        {card.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">
                        {card.body}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={card.href}
                    className={cn(
                      "mt-3 flex min-h-9 w-full items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      tone.button,
                    )}
                  >
                    {card.cta}
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
        <Link
          href={WHATSAPP_JOIN_URL}
          target={whatsappExternal ? "_blank" : undefined}
          rel={whatsappExternal ? "noopener noreferrer" : undefined}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/40 focus-visible:ring-offset-2"
          aria-label="Chat on WhatsApp for application support"
        >
          <Image
            src={whatsappSupportImage}
            alt="WhatsApp Support — Get real-time updates on your applications, interviews and more. Chat on WhatsApp."
            className="h-auto w-full"
            sizes="(min-width: 1024px) 304px, 100vw"
            priority={false}
          />
        </Link>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-foreground">
            Application Overview
          </h2>
          <Link
            href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
            className="text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            View Report
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <OverviewMetric
            label="Total Applied"
            value={total}
            loading={statsLoading}
            tone="primary"
          />
          <OverviewMetric
            label="Under Review"
            value={getStatsChipCount("underReview", stats)}
            loading={statsLoading}
            tone="orange"
          />
          <OverviewMetric
            label="Shortlisted"
            value={getStatsChipCount("shortlisted", stats)}
            loading={statsLoading}
            tone="purple"
          />
          <OverviewMetric
            label="Interviews"
            value={getStatsChipCount("interview", stats)}
            loading={statsLoading}
            tone="teal"
          />
          <OverviewMetric
            label="Offers"
            value={getStatsChipCount("offer", stats)}
            loading={statsLoading}
            tone="green"
          />
          <OverviewMetric
            label="Rejected"
            value={getStatsChipCount("rejected", stats)}
            loading={statsLoading}
            tone="red"
          />
        </div>

        <div className="mt-4 rounded-lg bg-primary-light/50 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted">Success Rate</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {statsLoading ? "—" : `${successRate}%`}
            </p>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-primary-light"
            role="progressbar"
            aria-valuenow={successRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Application success rate"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, successRate))}%` }}
            />
          </div>
        </div>
      </section>
    </aside>
  );
}
