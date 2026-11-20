"use client";

import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import {
  fetchMySubscription,
  subscriptionQueryKeys,
} from "@/services/subscription.service";
import type { MySubscription, SubscriptionGrant } from "@/types/subscription";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

/** The grant the next job post will draw from (backend consumes oldest-first). */
function resolveCurrentGrant(data: MySubscription | undefined): SubscriptionGrant | null {
  if (!data) return null;
  return (
    data.activeGrants.find((grant) => grant.jobCreditsRemaining > 0) ??
    data.history[data.history.length - 1] ??
    null
  );
}

function MetricCard({
  children,
  className = "",
  dataTour,
}: {
  children: ReactNode;
  className?: string;
  dataTour?: string;
}) {
  return (
    <div
      data-tour={dataTour}
      className={`employer-subscription-metric flex h-full min-h-0 min-w-0 flex-col rounded-lg border border-border-subtle bg-surface p-2.5 shadow-sm sm:rounded-xl sm:p-3.5 lg:rounded-lg lg:p-2 ${className}`}
    >
      {children}
    </div>
  );
}

function MetricLabel({ children }: { children: ReactNode }) {
  return (
    <p className="employer-subscription-metric__label text-[0.6875rem] font-medium leading-tight text-muted sm:text-xs lg:text-[0.625rem]">
      {children}
    </p>
  );
}

function MetricValue({ children, loading }: { children: ReactNode; loading: boolean }) {
  if (loading) {
    return <div className="mt-1.5 h-4 w-14 animate-pulse rounded bg-hero-bg sm:mt-2.5 lg:mt-1.5" />;
  }
  return (
    <p className="employer-subscription-metric__value mt-1 truncate text-sm font-bold tabular-nums leading-tight text-foreground sm:mt-2 sm:text-[0.9375rem] lg:mt-1 lg:text-[0.8125rem]">
      {children}
    </p>
  );
}

function ProgressMeter({ percent }: { percent: number }) {
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
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardSubscriptionOverview() {
  const t = useTranslate();
  const subscriptionQuery = useQuery({
    queryKey: subscriptionQueryKeys.mine,
    queryFn: fetchMySubscription,
    staleTime: 60_000,
  });

  const data = subscriptionQuery.data;
  const loading = subscriptionQuery.isLoading;
  const currentGrant = resolveCurrentGrant(data);
  const totalCredits = data?.activeGrants.reduce((sum, grant) => sum + grant.jobCredits, 0) ?? 0;
  const usedCredits =
    data?.activeGrants.reduce((sum, grant) => sum + grant.jobCreditsUsed, 0) ?? 0;
  const creditsLeft = data?.jobCreditsRemaining ?? 0;

  if (subscriptionQuery.isError) {
    return null;
  }

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
          <MetricLabel>{t("employer.subscription.currentPlan")}</MetricLabel>
          <MetricValue loading={loading}>{currentGrant?.planName ?? "—"}</MetricValue>
          {data && creditsLeft > 0 ? (
            <span className="employer-subscription-badge mt-auto inline-flex w-fit items-center rounded-full bg-benefit-whatsapp-surface px-2 py-0.5 text-[0.625rem] font-semibold text-benefit-whatsapp-icon sm:text-[0.6875rem] lg:px-1.5 lg:py-px lg:text-[0.5625rem]">
              {t("employer.subscription.statusActive")}
            </span>
          ) : null}
        </MetricCard>

        <MetricCard>
          <MetricLabel>{t("employer.subscriptionPage.dashboard.jobPostsLeft")}</MetricLabel>
          <MetricValue loading={loading}>
            {creditsLeft} / {totalCredits}
          </MetricValue>
          {data ? <ProgressMeter percent={usagePercent(usedCredits, totalCredits)} /> : null}
        </MetricCard>

        <MetricCard>
          <MetricLabel>{t("employer.subscriptionPage.dashboard.cities")}</MetricLabel>
          <MetricValue loading={loading}>
            {currentGrant
              ? `${currentGrant.citiesUsed.length} / ${currentGrant.maxCities}`
              : "—"}
          </MetricValue>
        </MetricCard>

        <MetricCard>
          <MetricLabel>{t("employer.subscriptionPage.dashboard.validity")}</MetricLabel>
          <MetricValue loading={loading}>
            {currentGrant
              ? t("employer.subscriptionPage.dashboard.daysValue", {
                  days: currentGrant.listingValidityDays,
                })
              : "—"}
          </MetricValue>
        </MetricCard>

        <MetricCard className="col-span-2 lg:col-span-4" dataTour="employer-home-subscription">
          <p
            className={`text-[0.6875rem] leading-snug sm:text-sm lg:text-[0.6875rem] ${
              data && !data.canPostJob ? "font-semibold text-red-700" : "text-muted"
            }`}
          >
            {data && !data.canPostJob
              ? t("employer.subscriptionPage.cannotPost")
              : t("employer.subscriptionPage.plansSubtitle")}
          </p>
          <Link
            href={ROUTES.EMPLOYER_SUBSCRIPTION}
            className="employer-subscription-cta mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:mt-3 sm:h-10 sm:text-sm lg:mt-1.5 lg:h-8 lg:text-[0.6875rem]"
          >
            {t("employer.subscriptionPage.dashboard.buyMore")}
          </Link>
        </MetricCard>
      </div>
    </section>
  );
}
