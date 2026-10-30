"use client";

import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { CirclePlay } from "lucide-react";
import Link from "next/link";

export function EmployerJobsHeader() {
  const t = useTranslate();

  return (
    <header className="employer-jobs-header flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:gap-3">
      <div className="min-w-0">
        <h1 className="employer-jobs-header__title text-xl font-bold tracking-tight text-foreground sm:text-[1.625rem] lg:text-[1.25rem]">
          {t("employer.nav.jobs")}
        </h1>
        <p className="employer-jobs-header__subtitle mt-0.5 max-w-xl break-words text-xs leading-snug text-muted sm:text-sm lg:text-xs">
          {t("employer.jobs.pageSubtitle")}
        </p>
      </div>

      <Link
        href={ROUTES.EMPLOYER_HELP_CENTER}
        className="employer-jobs-header__link inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-xs font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm lg:text-xs"
      >
        <CirclePlay
          className="size-3.5 sm:size-4 lg:size-3.5"
          aria-hidden="true"
          strokeWidth={2}
        />
        {t("employer.jobs.howItWorks")}
      </Link>
    </header>
  );
}
