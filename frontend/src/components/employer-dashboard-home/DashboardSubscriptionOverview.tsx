"use client";

import { EMPLOYER_DASHBOARD_SUBSCRIPTION_OVERVIEW } from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
import { Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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
      className={`flex h-full min-h-0 min-w-0 flex-col rounded-lg border border-border-subtle bg-surface p-2.5 shadow-sm sm:rounded-xl sm:p-3 lg:p-3.5 ${className}`}
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
  return (
    <div className="mt-auto w-full pt-2 sm:pt-2.5">
      <p className="mb-1 text-center text-[0.5625rem] font-semibold text-primary sm:text-[0.625rem] lg:text-[0.6875rem]">
        {percent}% Used
      </p>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-hero-bg sm:h-1.5"
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
          {data.title}
        </h2>
        <p className="mt-0.5 text-xs text-muted sm:text-sm">{data.subtitle}</p>
      </header>

      <div className="-mx-0.5 overflow-x-auto px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid min-w-[40rem] grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.35fr)_minmax(0,1.35fr)] items-stretch gap-1.5 sm:min-w-0 sm:gap-2 lg:gap-2.5 xl:gap-3">
        <MetricCard>
          <p className="text-[0.5625rem] font-medium leading-tight text-muted sm:text-[0.625rem] lg:text-[0.6875rem]">
            Current Plan
          </p>
          <div className="mt-1.5 flex min-w-0 flex-col items-start gap-1 sm:mt-2">
            <p className="w-full truncate text-[0.6875rem] font-bold leading-tight text-foreground sm:text-xs lg:text-sm">
              {data.planName}
            </p>
            <span className="inline-flex items-center rounded-full bg-benefit-whatsapp-surface px-1.5 py-0.5 text-[0.5rem] font-semibold text-benefit-whatsapp-icon sm:px-2 sm:text-[0.5625rem] lg:text-[0.625rem]">
              {data.planStatus}
            </span>
          </div>
          <p className="mt-auto pt-2 text-[0.5625rem] leading-snug text-muted sm:text-[0.625rem] lg:text-[0.6875rem]">
            {data.renewsOnLabel} {data.renewsOn}
          </p>
        </MetricCard>

        <MetricCard>
          <p className="text-[0.5625rem] font-medium leading-tight text-muted sm:text-[0.625rem] lg:text-[0.6875rem]">
            Job Posts Used
          </p>
          <p className="mt-1.5 text-[0.6875rem] font-bold tabular-nums text-foreground sm:mt-2 sm:text-xs lg:text-sm">
            {data.jobPostsUsed.used} / {data.jobPostsUsed.limit}
          </p>
          <ProgressMeter percent={jobPostsPercent} barClassName="bg-primary" />
        </MetricCard>

        <MetricCard>
          <p className="text-[0.5625rem] font-medium leading-tight text-muted sm:text-[0.625rem] lg:text-[0.6875rem]">
            Active Job Posts
          </p>
          <p className="mt-1.5 text-[0.6875rem] font-bold tabular-nums text-foreground sm:mt-2 sm:text-xs lg:text-sm">
            {data.activeJobPosts.used} / {data.activeJobPosts.limit}
          </p>
          <ProgressMeter
            percent={activePostsPercent}
            barClassName="bg-benefit-whatsapp-icon"
          />
        </MetricCard>

        <MetricCard>
          <p className="text-[0.5625rem] font-medium leading-tight text-muted sm:text-[0.625rem] lg:text-[0.6875rem]">
            Applications
          </p>
          <p className="mt-1.5 text-[0.6875rem] font-bold tabular-nums leading-snug text-foreground sm:mt-2 sm:text-xs lg:text-sm">
            {data.applications.used.toLocaleString("en-IN")} /{" "}
            {data.applications.limitLabel}
          </p>
          {data.applications.isUnlimited ? (
            <span className="mt-auto inline-flex w-fit items-center rounded-full bg-benefit-whatsapp-surface px-1.5 py-0.5 text-[0.5rem] font-semibold text-benefit-whatsapp-icon sm:px-2 sm:text-[0.5625rem] lg:text-[0.625rem]">
              Unlimited
            </span>
          ) : null}
        </MetricCard>

        <MetricCard>
          <p className="text-[0.6875rem] font-bold text-foreground sm:text-xs lg:text-sm">
            {data.benefitsTitle}
          </p>
          <ul className="mt-1.5 flex flex-1 flex-col gap-1 sm:mt-2 sm:gap-1.5">
            {data.benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-1 text-[0.5625rem] leading-snug text-foreground sm:gap-1.5 sm:text-[0.625rem] lg:text-[0.6875rem]"
              >
                <span className="mt-0.5 inline-flex size-3 shrink-0 items-center justify-center rounded-full bg-benefit-whatsapp-surface text-benefit-whatsapp-icon sm:size-3.5 lg:size-4">
                  <Check
                    className="size-2 sm:size-2.5"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0">{benefit}</span>
              </li>
            ))}
          </ul>
          <Link
            href={ROUTES.EMPLOYER_SUBSCRIPTION}
            className="mt-2 inline-flex h-7 w-full items-center justify-center rounded-md bg-primary px-2 text-[0.625rem] font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:mt-2.5 sm:h-8 sm:rounded-lg sm:text-xs lg:h-9 lg:text-sm"
          >
            {data.upgradeLabel}
          </Link>
        </MetricCard>

        <MetricCard>
          <p className="text-[0.6875rem] font-bold text-foreground sm:text-xs lg:text-sm">
            {data.billingTitle}
          </p>
          <dl className="mt-1.5 grid grid-cols-1 gap-1.5 sm:mt-2 sm:gap-2 lg:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-[0.5625rem] text-muted sm:text-[0.625rem] lg:text-xs">
                {data.nextBillingLabel}
              </dt>
              <dd className="mt-0.5 truncate text-[0.6875rem] font-semibold text-foreground sm:text-xs lg:text-sm">
                {data.nextBilling}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[0.5625rem] text-muted sm:text-[0.625rem] lg:text-xs">
                {data.amountLabel}
              </dt>
              <dd className="mt-0.5 text-[0.6875rem] font-semibold tabular-nums text-foreground sm:text-xs lg:text-sm">
                {data.amount}
              </dd>
            </div>
          </dl>

          <div className="mt-auto pt-2">
            <p className="text-[0.5625rem] text-muted sm:text-[0.625rem] lg:text-xs">
              {data.paymentMethodLabel}
            </p>
            <div className="mt-1 flex flex-col gap-1.5 sm:mt-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-2">
              <p className="min-w-0 truncate text-[0.6875rem] font-semibold tracking-wide text-foreground sm:text-xs lg:text-sm">
                {data.paymentMethodMasked}
              </p>
              <Link
                href={ROUTES.EMPLOYER_SUBSCRIPTION}
                className="inline-flex h-6 w-fit shrink-0 items-center rounded-md bg-primary-light px-2 text-[0.5625rem] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-7 sm:px-2.5 sm:text-xs"
              >
                {data.manageLabel}
              </Link>
            </div>
          </div>
        </MetricCard>
        </div>
      </div>
    </section>
  );
}
