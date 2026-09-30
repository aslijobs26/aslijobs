"use client";

import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { CirclePlay } from "lucide-react";
import Link from "next/link";

export function EmployerJobsHeader() {
  const t = useTranslate();

  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-[1.625rem]">
          {t("employer.nav.jobs")}
        </h1>
        <p className="mt-0.5 max-w-xl break-words text-xs leading-snug text-muted sm:text-sm">
          {t("employer.jobs.pageSubtitle")}
        </p>
      </div>

      <Link
        href={ROUTES.EMPLOYER_HELP_CENTER}
        className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-xs font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
      >
        <CirclePlay
          className="size-3.5 sm:size-4"
          aria-hidden="true"
          strokeWidth={2}
        />
        {t("employer.jobs.howItWorks")}
      </Link>
    </header>
  );
}
