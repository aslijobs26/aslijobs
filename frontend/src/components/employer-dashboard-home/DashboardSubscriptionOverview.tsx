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
      className={`employer-subscription-metric flex h-full min-h-0 min-w-0 flex-col rounded-lg border border-border-subtle bg-surface p-2.5 shadow-sm sm:rounded-xl sm:p-3.5 lg:rounded-lg lg:p-2 ${className}`}
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
    <div className="employer-subscription-progress mt-auto w-full pt-2 sm:pt-3 lg:pt-1.5">
      <p className="employer-subscription-progress__label mb-1 text-center text-[0.625rem] font-semibold text-primary sm:mb-1.5 sm:text-xs lg:mb-0.5 lg:text-[0.5625rem]">
        {t("employer.subscription.percentUsed", { percent })}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-hero-bg lg:h-1"
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
      className="employer-subscription-card rounded-xl border border-primary/10 bg-primary-light p-2.5 sm:p-4 lg:p-2.5"
      aria-labelledby="dashboard-subscription-overview-title"
    >
      <header className="mb-2 sm:mb-4 lg:mb-2">
        <h2
          id="dashboard-subscription-overview-title"
          className="employer-subscription-card__title text-xs font-bold text-foreground sm:text-base lg:text-[0.8125rem]"
        >
          {t("employer.subscription.title")}
        </h2>
        <p className="employer-subscription-card__subtitle mt-0.5 text-[0.6875rem] text-muted sm:text-sm lg:text-[0.6875rem]">
          {t("employer.subscription.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-2 items-stretch gap-1.5 sm:gap-2.5 lg:grid-cols-4 lg:gap-1.5">
        <MetricCard>
          <p className="employer-subscription-metric__label text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs lg:text-[0.625rem]">
            {t("employer.subscription.currentPlan")}
          </p>
          <div className="mt-1 flex min-w-0 flex-col items-start gap-1 sm:mt-2 sm:gap-1.5 lg:mt-1 lg:gap-1">
            <p className="employer-subscription-metric__value w-full truncate text-sm font-bold leading-tight text-foreground sm:text-[0.9375rem] lg:text-[0.8125rem]">
              {data.planName}
            </p>
            <span className="employer-subscription-badge inline-flex items-center rounded-full bg-benefit-whatsapp-surface px-2 py-0.5 text-[0.625rem] font-semibold text-benefit-whatsapp-icon sm:text-[0.6875rem] lg:px-1.5 lg:py-px lg:text-[0.5625rem]">
              {t("employer.subscription.statusActive")}
            </span>
          </div>
          <p className="employer-subscription-metric__meta mt-auto pt-1.5 text-[0.6875rem] leading-snug text-muted sm:pt-2.5 sm:text-xs lg:pt-1 lg:text-[0.625rem]">
            {t("employer.subscription.renewsOn", { date: data.renewsOn })}
          </p>
        </MetricCard>

        <MetricCard>
          <p className="employer-subscription-metric__label text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs lg:text-[0.625rem]">
            {t("employer.subscription.jobPostsUsed")}
          </p>
          <p className="employer-subscription-metric__value mt-1 text-sm font-bold tabular-nums text-foreground sm:mt-2 sm:text-[0.9375rem] lg:mt-1 lg:text-[0.8125rem]">
            {data.jobPostsUsed.used} / {data.jobPostsUsed.limit}
          </p>
          <ProgressMeter percent={jobPostsPercent} barClassName="bg-primary" />
        </MetricCard>

        <MetricCard>
          <p className="employer-subscription-metric__label text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs lg:text-[0.625rem]">
            {t("employer.subscription.activeJobPosts")}
          </p>
          <p className="employer-subscription-metric__value mt-1 text-sm font-bold tabular-nums text-foreground sm:mt-2 sm:text-[0.9375rem] lg:mt-1 lg:text-[0.8125rem]">
            {data.activeJobPosts.used} / {data.activeJobPosts.limit}
          </p>
          <ProgressMeter
            percent={activePostsPercent}
            barClassName="bg-benefit-whatsapp-icon"
          />
        </MetricCard>

        <MetricCard>
          <p className="employer-subscription-metric__label text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs lg:text-[0.625rem]">
            {t("employer.stats.applications")}
          </p>
          <p className="employer-subscription-metric__value mt-1 text-sm font-bold tabular-nums leading-snug text-foreground sm:mt-2 sm:text-[0.9375rem] lg:mt-1 lg:text-[0.8125rem]">
            {data.applications.used.toLocaleString("en-IN")} /{" "}
            {data.applications.isUnlimited
              ? t("employer.subscription.unlimited")
              : data.applications.limitLabel}
          </p>
          {data.applications.isUnlimited ? (
            <span className="employer-subscription-badge mt-auto inline-flex w-fit items-center rounded-full bg-benefit-whatsapp-surface px-2 py-0.5 text-[0.625rem] font-semibold text-benefit-whatsapp-icon sm:text-[0.6875rem] lg:px-1.5 lg:py-px lg:text-[0.5625rem]">
              {t("employer.subscription.unlimited")}
            </span>
          ) : null}
        </MetricCard>

        <MetricCard className="col-span-2">
          <p className="employer-subscription-metric__value text-xs font-bold text-foreground sm:text-[0.9375rem] lg:text-[0.8125rem]">
            {t("employer.subscription.benefitsTitle")}
          </p>
          <ul className="employer-subscription-benefits mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 sm:mt-2 sm:grid-cols-1 sm:gap-2 lg:mt-1 lg:grid-cols-2 lg:gap-x-2 lg:gap-y-1">
            {SUBSCRIPTION_BENEFIT_KEYS.map((benefitKey) => (
              <li
                key={benefitKey}
                className="employer-subscription-benefit flex items-start gap-1.5 text-[0.6875rem] leading-snug text-foreground sm:text-xs lg:gap-1 lg:text-[0.625rem]"
              >
                <span className="mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-benefit-whatsapp-surface text-benefit-whatsapp-icon sm:size-4 lg:size-3">
                  <Check
                    className="size-2.5 lg:size-2"
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
            className="employer-subscription-cta mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:mt-3 sm:h-10 sm:text-sm lg:mt-1.5 lg:h-8 lg:text-[0.6875rem]"
          >
            {t("employer.subscription.upgradePlan")}
          </Link>
        </MetricCard>

        <MetricCard className="col-span-2">
          <p className="employer-subscription-metric__value text-xs font-bold text-foreground sm:text-[0.9375rem] lg:text-[0.8125rem]">
            {t("employer.subscription.billingTitle")}
          </p>
          <dl className="employer-subscription-billing mt-1.5 grid grid-cols-2 gap-1.5 sm:mt-2 sm:gap-3 lg:mt-1 lg:gap-2">
            <div className="min-w-0">
              <dt className="employer-subscription-metric__label text-[0.6875rem] text-muted sm:text-xs lg:text-[0.625rem]">
                {t("employer.subscription.nextBilling")}
              </dt>
              <dd className="employer-subscription-metric__value mt-0.5 truncate text-sm font-semibold text-foreground sm:text-[0.9375rem] lg:text-[0.8125rem]">
                {data.nextBilling}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="employer-subscription-metric__label text-[0.6875rem] text-muted sm:text-xs lg:text-[0.625rem]">
                {t("employer.subscription.amount")}
              </dt>
              <dd className="employer-subscription-metric__value mt-0.5 text-sm font-semibold tabular-nums text-foreground sm:text-[0.9375rem] lg:text-[0.8125rem]">
                {data.amount}
              </dd>
            </div>
          </dl>

          <div className="employer-subscription-billing-footer mt-auto pt-2 sm:pt-3 lg:pt-1.5">
            <p className="employer-subscription-metric__label text-[0.6875rem] text-muted sm:text-xs lg:text-[0.625rem]">
              {t("employer.subscription.paymentMethod")}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 lg:mt-1">
              <p className="employer-subscription-metric__value min-w-0 truncate text-sm font-semibold tracking-wide text-foreground sm:text-[0.9375rem] lg:text-[0.8125rem]">
                {data.paymentMethodMasked}
              </p>
              <Link
                href={ROUTES.EMPLOYER_SUBSCRIPTION}
                className="employer-subscription-manage inline-flex h-8 shrink-0 items-center rounded-lg bg-primary-light px-2.5 text-[0.6875rem] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:px-3 sm:text-xs lg:h-7 lg:px-2 lg:text-[0.625rem]"
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
