"use client";

import welcomeIllustration from "@/assets/employer-dashboard/welcome-banner-illustration-v4.png";
import {
  EMPLOYER_DASHBOARD_HERO_ROW_HEIGHT_CLASS,
  EMPLOYER_DASHBOARD_POST_JOB_LABEL,
  EMPLOYER_DASHBOARD_SEARCH_CANDIDATES_LABEL,
  EMPLOYER_DASHBOARD_WELCOME_BADGE,
  EMPLOYER_DASHBOARD_WELCOME_TAGLINE,
} from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type DashboardWelcomeBannerProps = {
  displayName: string;
  isLoading?: boolean;
};

export function DashboardWelcomeBanner({
  displayName,
  isLoading = false,
}: DashboardWelcomeBannerProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-border-subtle bg-employer-welcome-surface shadow-sm ${EMPLOYER_DASHBOARD_HERO_ROW_HEIGHT_CLASS}`}
    >
      <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-primary-light/70" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 size-64 rounded-full bg-primary-light/40 sm:hidden" aria-hidden="true" />

      <div className="relative z-10 flex h-full min-h-[13.5rem] flex-col justify-between gap-4 p-4 sm:min-h-[15.5rem] sm:gap-5 sm:p-6 lg:p-7">
        <div
          className="pointer-events-none absolute -right-1 top-3 h-[9.5rem] w-[46%] bg-employer-welcome-surface sm:inset-y-0 sm:right-0 sm:top-0 sm:h-auto sm:w-[38%] md:w-[42%] lg:w-[40%]"
          aria-hidden="true"
        >
          <Image
            src={welcomeIllustration}
            alt=""
            fill
            className="object-contain object-right-top sm:object-right md:object-cover md:object-center"
            sizes="(max-width: 639px) 46vw, (max-width: 767px) 38vw, (max-width: 1023px) 42vw, 40vw"
            priority
          />
        </div>

        <div className="relative z-10 min-w-0 w-full">
          <div className="min-w-0 max-w-[54%] sm:max-w-[62%] md:max-w-[58%]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-[0.6875rem] font-semibold text-primary sm:text-xs">
              <span aria-hidden="true">👋</span>
              {EMPLOYER_DASHBOARD_WELCOME_BADGE}
            </span>

            {isLoading ? (
              <div className="mt-3 space-y-2">
                <div className="h-7 w-40 animate-pulse rounded-lg bg-hero-bg sm:h-8 sm:w-56" />
                <div className="h-7 w-48 animate-pulse rounded-lg bg-hero-bg sm:h-8 sm:w-64" />
              </div>
            ) : (
              <h1 className="mt-3 text-xl font-bold leading-[1.2] tracking-tight text-foreground sm:text-[1.75rem] lg:text-[1.875rem]">
                <span className="block">Welcome back,</span>
                <span className="block truncate text-primary">
                  {displayName}!
                  <span aria-hidden="true"> 👋</span>
                </span>
              </h1>
            )}

            <p className="mt-2 text-sm leading-relaxed text-muted sm:mt-2.5 sm:text-[0.9375rem]">
              {EMPLOYER_DASHBOARD_WELCOME_TAGLINE}
            </p>
          </div>

          <div className="mt-4 flex flex-nowrap items-center gap-1.5 sm:mt-5 sm:max-w-[62%] sm:gap-3 md:max-w-[58%]">
            <Link
              href={ROUTES.POST_JOB}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2.5 text-[0.6875rem] font-semibold text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <span className="inline-flex size-5 items-center justify-center rounded-md bg-surface/20 sm:size-6">
                <Plus className="size-3 sm:size-3.5" aria-hidden="true" strokeWidth={2.5} />
              </span>
              {EMPLOYER_DASHBOARD_POST_JOB_LABEL}
            </Link>
            <Link
              href={ROUTES.EMPLOYER_CANDIDATES}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-subtle bg-surface px-2.5 text-[0.6875rem] font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary-light text-primary sm:size-6">
                <Search className="size-3 sm:size-3.5" aria-hidden="true" />
              </span>
              {EMPLOYER_DASHBOARD_SEARCH_CANDIDATES_LABEL}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
