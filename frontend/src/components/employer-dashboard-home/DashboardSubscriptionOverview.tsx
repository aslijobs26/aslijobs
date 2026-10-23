"use client";

import { EMPLOYER_DASHBOARD_SUBSCRIPTION_OVERVIEW } from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const SUBSCRIPTION_BENEFIT_KEYS = [
  "employer.subscription.benefitPostJobs",
  "employer.subscription.benefitUnlimitedApplications",
  "employer.subscription.benefitAnalytics",
  "employer.subscription.benefitPrioritySupport",
] as const;

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

function MetricCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-3.5 lg:p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressMeter({
  percent,
  barClassName,
}: {
  percent: number;
  barClassName: string;
}) {
  const t = useTranslate();

  return (
    <div className="mt-auto w-full pt-2.5 sm:pt-3">
      <p className="mb-1.5 text-center text-[0.6875rem] font-semibold text-primary sm:text-xs">
        {t("employer.subscription.percentUsed", { percent })}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-hero-bg"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardSubscriptionOverview() {
  const t = useTranslate();
  const data = EMPLOYER_DASHBOARD_SUBSCRIPTION_OVERVIEW;
  const jobPostsPercent = usagePercent(
    data.jobPostsUsed.used,
    data.jobPostsUsed.limit,
  );
  const activePostsPercent = usagePercent(
    data.activeJobPosts.used,
    data.activeJobPosts.limit,
  );

  return (
    <section
      className="rounded-xl border border-primary/10 bg-primary-light p-3 sm:p-4 lg:p-5"
      aria-labelledby="dashboard-subscription-overview-title"
    >
      <header className="mb-3 sm:mb-4">
        <h2
          id="dashboard-subscription-overview-title"
          className="text-sm font-bold text-foreground sm:text-base lg:text-lg"
        >
          {t("employer.subscription.title")}
        </h2>
        <p className="mt-0.5 text-xs text-muted sm:text-sm">
          {t("employer.subscription.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-2 items-stretch gap-2 sm:gap-2.5 lg:grid-cols-4 lg:gap-3">
        <MetricCard>
          <p className="text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs">
            {t("employer.subscription.currentPlan")}
          </p>
          <div className="mt-2 flex min-w-0 flex-col items-start gap-1.5">
            <p className="w-full truncate text-sm font-bold leading-tight text-foreground sm:text-[0.9375rem]">
              {data.planName}
            </p>
            <span className="inline-flex items-center rounded-full bg-benefit-whatsapp-surface px-2 py-0.5 text-[0.625rem] font-semibold text-benefit-whatsapp-icon sm:text-[0.6875rem]">
              {t("employer.subscription.statusActive")}
            </span>
          </div>
          <p className="mt-auto pt-2.5 text-[0.6875rem] leading-snug text-muted sm:text-xs">
            {t("employer.subscription.renewsOn", { date: data.renewsOn })}
          </p>
        </MetricCard>

        <MetricCard>
          <p className="text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs">
            {t("employer.subscription.jobPostsUsed")}
          </p>
          <p className="mt-2 text-sm font-bold tabular-nums text-foreground sm:text-[0.9375rem]">
            {data.jobPostsUsed.used} / {data.jobPostsUsed.limit}
          </p>
          <ProgressMeter percent={jobPostsPercent} barClassName="bg-primary" />
        </MetricCard>

        <MetricCard>
          <p className="text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs">
            {t("employer.subscription.activeJobPosts")}
          </p>
          <p className="mt-2 text-sm font-bold tabular-nums text-foreground sm:text-[0.9375rem]">
            {data.activeJobPosts.used} / {data.activeJobPosts.limit}
          </p>
          <ProgressMeter
            percent={activePostsPercent}
            barClassName="bg-benefit-whatsapp-icon"
          />
        </MetricCard>

        <MetricCard>
          <p className="text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs">
            {t("employer.stats.applications")}
          </p>
          <p className="mt-2 text-sm font-bold tabular-nums leading-snug text-foreground sm:text-[0.9375rem]">
            {data.applications.used.toLocaleString("en-IN")} /{" "}
            {data.applications.isUnlimited
              ? t("employer.subscription.unlimited")
              : data.applications.limitLabel}
          </p>
          {data.applications.isUnlimited ? (
            <span className="mt-auto inline-flex w-fit items-center rounded-full bg-benefit-whatsapp-surface px-2 py-0.5 text-[0.625rem] font-semibold text-benefit-whatsapp-icon sm:text-[0.6875rem]">
              {t("employer.subscription.unlimited")}
            </span>
          ) : null}
        </MetricCard>

        <MetricCard className="col-span-2">
          <p className="text-sm font-bold text-foreground sm:text-[0.9375rem]">
            {t("employer.subscription.benefitsTitle")}
          </p>
          <ul className="mt-2 flex flex-1 flex-col gap-1.5 sm:gap-2">
            {SUBSCRIPTION_BENEFIT_KEYS.map((benefitKey) => (
              <li
                key={benefitKey}
                className="flex items-start gap-1.5 text-[0.6875rem] leading-snug text-foreground sm:text-xs"
              >
                <span className="mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-benefit-whatsapp-surface text-benefit-whatsapp-icon sm:size-4">
                  <Check
                    className="size-2.5"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 break-words">{t(benefitKey)}</span>
              </li>
            ))}
          </ul>
          <Link
            href={ROUTES.EMPLOYER_SUBSCRIPTION}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:text-sm"
          >
            {t("employer.subscription.upgradePlan")}
          </Link>
        </MetricCard>

        <MetricCard className="col-span-2">
          <p className="text-sm font-bold text-foreground sm:text-[0.9375rem]">
            {t("employer.subscription.billingTitle")}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2 sm:gap-3">
            <div className="min-w-0">
              <dt className="text-[0.6875rem] text-muted sm:text-xs">
                {t("employer.subscription.nextBilling")}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-foreground sm:text-[0.9375rem]">
                {data.nextBilling}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[0.6875rem] text-muted sm:text-xs">
                {t("employer.subscription.amount")}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground sm:text-[0.9375rem]">
                {data.amount}
              </dd>
            </div>
          </dl>

          <div className="mt-auto pt-3">
            <p className="text-[0.6875rem] text-muted sm:text-xs">
              {t("employer.subscription.paymentMethod")}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold tracking-wide text-foreground sm:text-[0.9375rem]">
                {data.paymentMethodMasked}
              </p>
              <Link
                href={ROUTES.EMPLOYER_SUBSCRIPTION}
                className="inline-flex h-8 shrink-0 items-center rounded-lg bg-primary-light px-2.5 text-[0.6875rem] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:px-3 sm:text-xs"
              >
                {t("employer.subscription.manage")}
              </Link>
            </div>
          </div>
        </MetricCard>
      </div>
    </section>
  );
}
